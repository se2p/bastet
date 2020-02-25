/*
 *   BASTET Program Analysis and Verification Framework
 *
 *   Copyright 2019 by University of Passau (uni-passau.de)
 *
 *   Maintained by Andreas Stahlbauer (firstname@lastname.net)
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

import {LabeledTransferRelation, TransferRelation, Transfers} from "../TransferRelation";
import {
    ControlAbstractState,
    THREAD_STATE_DONE,
    THREAD_STATE_FAILURE,
    THREAD_STATE_RUNNING,
    THREAD_STATE_RUNNING_ATOMIC,
    THREAD_STATE_YIELD,
    ThreadState
} from "./ControlAbstractDomain";
import {Preconditions} from "../../../utils/Preconditions";
import {ImplementMeException} from "../../../core/exceptions/ImplementMeException";
import {OperationID, ProgramOperation, ProgramOperations} from "../../../syntax/app/controlflow/ops/ProgramOperation";
import {LocationID} from "../../../syntax/app/controlflow/ControlLocation";
import {AbstractElement} from "../../../lattices/Lattice";
import {App} from "../../../syntax/app/App";
import {ScheduleAnalysisConfig} from "./ControlAnalysis";
import {List as ImmList, Set as ImmSet} from "immutable";
import {BroadcastAndWaitStatement} from "../../../syntax/ast/core/statements/BroadcastAndWaitStatement";
import {WaitSecsStatement} from "../../../syntax/ast/core/statements/WaitSecsStatement";
import {WaitUntilStatement} from "../../../syntax/ast/core/statements/WaitUntilStatement";
import {IllegalStateException} from "../../../core/exceptions/IllegalStateException";
import {MessageReceivedEvent} from "../../../syntax/ast/core/CoreEvent";
import {StringExpression, StringLiteral} from "../../../syntax/ast/core/expressions/StringExpression";
import {BroadcastMessageStatement} from "../../../syntax/ast/core/statements/BroadcastMessageStatement";
import {CallStatement} from "../../../syntax/ast/core/statements/CallStatement";
import {MethodIdentifiers} from "../../../syntax/app/controlflow/MethodIdentifiers";
import {Properties, Property} from "../../../syntax/Property";
import {ExpressionList} from "../../../syntax/ast/core/expressions/ExpressionList";
import instantiate = WebAssembly.instantiate;
import {Concern, Concerns} from "../../../syntax/Concern";
import {Logger} from "../../../utils/Logger";
import {Actor} from "../../../syntax/app/Actor";
import {MethodDefinition} from "../../../syntax/ast/core/MethodDefinition";
import {Method} from "../../../syntax/app/controlflow/Method";
import {ReturnStatement} from "../../../syntax/ast/core/statements/ControlStatement";

export type Schedule = ImmList<ThreadState>;

class StepInformation {

    private readonly _threadIndex: number;
    private readonly _succLoc: LocationID;
    private readonly _isInnerAtomic: boolean;
    private readonly _ops: ProgramOperation[];
    private readonly _returnCallTo: LocationID[];

    constructor(threadIndex: number, succLoc: number, isInnerAtomic: boolean, ops: ProgramOperation[], returnCallTo: LocationID[]) {
        this._threadIndex = threadIndex;
        this._succLoc = succLoc;
        this._isInnerAtomic = isInnerAtomic;
        this._ops = Preconditions.checkNotUndefined(ops);
        this._returnCallTo = Preconditions.checkNotUndefined(returnCallTo);
    }

    get threadIndex(): number {
        return this._threadIndex;
    }

    get succLoc(): number {
        return this._succLoc;
    }

    get isInnerAtomic(): boolean {
        return this._isInnerAtomic;
    }

    get ops(): ProgramOperation[] {
        return this._ops;
    }

    get returnCallTo(): LocationID[] {
        return this._returnCallTo;
    }
}

/**
 * Mimics the green-threading of the Scratch VM.
 * Adds special scheduling of some (types of) threads.
 */
export class ControlTransferRelation implements TransferRelation<ControlAbstractState> {

    private readonly _wrappedTransferRelation: LabeledTransferRelation<AbstractElement>;
    private readonly _config: ScheduleAnalysisConfig;
    private readonly _task: App;

    constructor(config: ScheduleAnalysisConfig, task: App, wrappedTransferRelation: LabeledTransferRelation<AbstractElement>) {
        this._task = Preconditions.checkNotUndefined(task);
        this._config = Preconditions.checkNotUndefined(config);
        this._wrappedTransferRelation = Preconditions.checkNotUndefined(wrappedTransferRelation);
    }

    abstractSucc(fromState: ControlAbstractState): Iterable<ControlAbstractState> {
        Preconditions.checkNotUndefined(fromState);
        Preconditions.checkNotUndefined(fromState.wrappedState);

        if (this._config.aggregateAtomicTransitions) {
            throw new ImplementMeException();
        } else {
            return this.abstractSuccSingleStep(fromState);
        }
    }

    /**
     * See the function `stepThreads()` of `sequencer.js` in the Scratch VM.
     *
     * @param fromState
     */
    abstractSuccSingleStep(fromState: ControlAbstractState): Iterable<ControlAbstractState> {
        if (this.hasObserverThreadToProcess(fromState)) {
            // If there is a thread state of the specification in the
            // state RUNNING, or WAITING, step it until no more of those are left.
            return this.specificationStep(fromState);
        } else {
            return this.programStep(fromState).map(
                (succ) =>
                    this.startAfterProgramStatementHandlerThreads(succ) );
        }
    }

    programStep(fromState: ControlAbstractState): ControlAbstractState[] {
        Preconditions.checkNotUndefined(fromState);

        // ATTENTION!!
        //
        // PROBLEM:
        //    The scheduling does not implement all details of the Scratch VM. In general,
        //    the Scratch VM implements a round-robin scheduling which would lead
        //    to a deterministic execution order. Nevertheless, there is a WORK_TIME timeout:
        //    reaching this timeout makes executions non-deterministic, because
        //    the the scheduling starts from the first thread in the list if this timout is reached.
        //
        // APPROACH:
        //    To make only sound propositions about Scratch programs, we throw
        //    an exception if the WORK_TIME timeout would have been reached before
        //    all threads in the list were stepped.

        const stepConcern: Concern = Concerns.defaultSpecificationConcern();

        const threadsToStep: number[] = this.chooseThreadToStep(fromState);
        if (threadsToStep.length === 0) {
            return [];
        }
        Preconditions.checkState(threadsToStep.length === 1);

        const threadIndexToStep: number = threadsToStep[0];
        const threadToStep: ThreadState = fromState.getThreadStates().get(threadIndexToStep);
        Preconditions.checkState(threadToStep.getComputationState() === THREAD_STATE_RUNNING || threadToStep.getComputationState() === THREAD_STATE_RUNNING_ATOMIC);

        // Determine the (sequences of) control-flow transition(s) to execute in this step
        // ATTENTION: We assume that each sequence corresponds to an atomic
        //      statement in the input programming language (Scratch)
        const leavingOps: StepInformation[] = this.resolveLeavingOps(threadToStep, threadIndexToStep);
        Preconditions.checkState(leavingOps.length > 0, "A thread with no leaving ops must NOT be in state THREAD_STATE_RUNNING");

        const result: ControlAbstractState[] = [];

        for (const stepToTake of leavingOps) {
            // Determine the new control (the next thread to execute)
            //   TODO: Take triggered events into account
            //   TODO: Determine sets of threads to wait for
            const nextSchedules: Schedule[] = this.computeNextSchedules(fromState.getThreadStates(), stepToTake);

            for (const newThreadStates of nextSchedules) {
                // Compute a successor state for each sequence and call the wrapped analysis to do so
                Preconditions.checkNotUndefined(fromState.wrappedState);
                const wrappedSuccStates: Iterable<AbstractElement> = Transfers.withIntermediateOps(
                    this._wrappedTransferRelation, fromState.wrappedState, stepToTake.ops, stepConcern);

                for (const w of wrappedSuccStates) {
                    Preconditions.checkNotUndefined(w);
                    const properties = this.extractProperties(nextSchedules);
                    const e = new ControlAbstractState(newThreadStates, w, properties);
                    result.push(e);
                }
            }
        }

        return result;
    }

    private extractProperties(sched: Schedule[]) {
        const properties = [];
        for (const s of sched) {
            for (const t of s) {
                for (const p of t.getFailedFor()) {
                    properties.push(p);
                }
            }
        }
        return ImmSet(properties);
    }

    /**
     * Get the list of indices of threads in the list of threads
     * that should make a step.
     *
     * @param fromState
     */
    private chooseThreadToStep(fromState: ControlAbstractState): number[] {
        Preconditions.checkNotUndefined(fromState);
        Preconditions.checkArgument(fromState.getThreadStates().size > 0);

        let index = 0;
        for (const t of fromState.getThreadStates()) {
            if (t.getComputationState() === THREAD_STATE_RUNNING
                || t.getComputationState() === THREAD_STATE_RUNNING_ATOMIC) {
                return [index];
            }
            index++;
        }

        // No threads left to be stepped
        return [];
    }

    private startAfterProgramStatementHandlerThreads(onState: ControlAbstractState): ControlAbstractState {
        return onState;
    }

    /**
     * Returns either a singleton-list or the empty list.
     */
    private resolveLeavingOps(threadState: ThreadState, threadIndex: number): StepInformation[] {
        const script = this._task.getActorByName(threadState.getActorId()).getScript(threadState.getScriptId());
        const threadActor: Actor = this._task.getActorByName(threadState.getActorId());

        Logger.potentialUnsound('Add support for atomic transitions');

        let result: StepInformation[] = [];
        for (const t of script.transitions.transitionsFrom(threadState.getLocationId())) {
            const isAtomic = false;
            const op: ProgramOperation = ProgramOperations.withID(t.opId);
            Preconditions.checkNotUndefined(op);

            if (op.ast instanceof CallStatement) {
                // The following lines realize the inter-procedural analysis.
                const returnCallTo: LocationID[] = [t.target];
                const calledMethod: Method = threadActor.getMethod(op.ast.calledMethod.text);
                const interProcOps: ProgramOperation[] = this.createPassArgumentsOps(calledMethod, op.ast.args);

                for (const entryLocId of calledMethod.controlflow.entryLocationSet) {
                    result.push(new StepInformation(threadIndex, entryLocId, isAtomic, interProcOps, returnCallTo));
                }
            } else if (op.ast instanceof ReturnStatement) {
                // Assign the result to the variable that was referenced in the `CallStatement`
                throw new ImplementMeException();
            } else {
                result.push(new StepInformation(threadIndex, t.target, isAtomic, [op], []));
            }
        }

        return result;
    }

    private createPassArgumentsOps(calledMethod: Method, args: ExpressionList): ProgramOperation[] {
        throw new ImplementMeException();
    }

    private restartThread(state: ControlAbstractState): ControlAbstractState {
        throw new ImplementMeException();
    }

    private stopThisScript(state: ControlAbstractState): ControlAbstractState {
        throw new ImplementMeException();
    }

    private hasObserverThreadToProcess(fromState: ControlAbstractState): boolean {
        for (const t of fromState.getThreadStates()) {
            const a = this._task.getActorByName(t.getActorId());
            if (a.isObserver) {
                return true;
            }
        }
        return false;
    }

    private specificationStep(fromState: ControlAbstractState): Iterable<ControlAbstractState> {
        const stepConcern = Concerns.defaultSpecificationConcern();
        throw new ImplementMeException();
    }

    private setCompState(inSchedule: Schedule, ofThreadWithIdx: number, compState: number): Schedule {
        return inSchedule.set(ofThreadWithIdx,
            inSchedule.get(ofThreadWithIdx).withComputationState(compState));
    }

    private setFailure(inSchedule: Schedule, ofThreadWithIdx: number, properties: ImmSet<Property>): Schedule {
        return inSchedule.set(ofThreadWithIdx,
            inSchedule.get(ofThreadWithIdx)
                .withComputationState(THREAD_STATE_FAILURE)
                .withFailedFor(properties));
    }

    /**
     * Given the control `threadStates` based on that `takenStep` was conducted,
     * create the set of succesor schedules.
     *
     * @param threadStates
     * @param takenStep
     */
    private computeNextSchedules(threadStates: Schedule, takenStep: StepInformation): Schedule[] {
        Preconditions.checkNotUndefined(threadStates);
        Preconditions.checkNotUndefined(takenStep);
        Preconditions.checkArgument(takenStep.ops.length === 1);

        const stepOp = takenStep.ops[0];
        const steppedThreadIdx = takenStep.threadIndex;

        // Set the new control location
        const steppedThread = threadStates.get(steppedThreadIdx)
            .withLocationId(takenStep.succLoc);
        let resultBase = threadStates.set(steppedThreadIdx, steppedThread);

        // TODO: Where and how to handle the `clone` statement?

        //
        // Handle different statements that start other threads and wait for them
        //
        if (stepOp.ast instanceof CallStatement) {
            const call = stepOp.ast as CallStatement;
            if (call.calledMethod.text == MethodIdentifiers._RUNTIME_signalFailure) {
                const properties: ImmSet<Property> = Properties.fromArguments(call.args);
                resultBase = this.setFailure(resultBase, steppedThreadIdx, properties);
            }
        } else if (stepOp.ast instanceof BroadcastMessageStatement) {
            const stmt: BroadcastMessageStatement = stepOp.ast as BroadcastMessageStatement;
            const msg: string = this.evaluateToConcreteMessage(stmt.msg);
            const waitForIndices: number[] = this.getAllMessageReceiverThreadsFrom(threadStates, msg);

            // Prepare the waiting threads for running
            for (const waitForThreadIdx of waitForIndices) {
                resultBase = this.setCompState(resultBase, waitForThreadIdx, THREAD_STATE_YIELD);
            }

        } else if (stepOp.ast instanceof BroadcastAndWaitStatement) {
            const stmt: BroadcastAndWaitStatement = stepOp.ast as BroadcastAndWaitStatement;
            const msg: string = this.evaluateToConcreteMessage(stmt.msg);
            const waitForIndices: number[] = this.getAllMessageReceiverThreadsFrom(threadStates, msg);
            const waitFor: ThreadState[] = waitForIndices.map((idx) => threadStates.get(idx));

            // Prepare the waiting threads for running
            for (const waitForThreadIdx of waitForIndices) {
                resultBase = this.setCompState(resultBase, waitForThreadIdx, THREAD_STATE_YIELD);
            }

            // Wait for all triggered threads to finish
            resultBase = resultBase.set(steppedThreadIdx, steppedThread.withWaitingForThreads(
                    steppedThread
                        .getWaitingForThreads()
                        .union(waitFor.map((t) => t.getThreadId()))));

        } else if (stepOp.ast instanceof WaitUntilStatement) {
            const stmt: WaitUntilStatement = stepOp.ast as WaitUntilStatement;

            // ASSUMPTION:
            //   For each WaitUntilStatement exists a special script that is triggered
            //   whenever the condition is met. The body of this script is empty.

            // const waitfor: ThreadState = this.getConditionCheckThreadFrom(threadStates, stmt.cond);
            // Preconditions.checkState(waitfor !== null, "There must be one condition check thread");

            // TODO:
            //   We might have to introduce an EXIT code of threads that signals
            //   whether or not a specific control location has been reached while
            //   processing the body.
            throw new ImplementMeException();

        } else if (stepOp.ast instanceof WaitSecsStatement) {
            const stmt: WaitSecsStatement = stepOp.ast as WaitSecsStatement;
            // const timeCond: BooleanExpression = this.createTimeCond(stmt.secs);
            // const waitfor: ThreadState = this.createTemporaryCheckThreadFor(timeCond);

            // TODO:
            //   Since (1) the `WaitSecsStatement` can be parameterized with
            //   a number expression, and (2) the condition is relative to the
            //   time the statement was invoked, a more elaborated logic is needed here.
            Logger.potentialUnsound("wait N seconds might have to be considered in the scheduling.")
        }

        if (takenStep.isInnerAtomic) {
            if (steppedThread.getComputationState() !== THREAD_STATE_RUNNING_ATOMIC) {
                resultBase = this.setCompState(resultBase, steppedThreadIdx, THREAD_STATE_RUNNING_ATOMIC);
            }
        } else {
            // The current state is either in RUNNING or RUNNING_ATOMIC
            Preconditions.checkState(steppedThread.getComputationState() == THREAD_STATE_RUNNING
                || steppedThread.getComputationState() == THREAD_STATE_RUNNING_ATOMIC);


            // YIELD the current state if it is not yet on a terminating control location
            // of the script.
            const nextOps = this.resolveLeavingOps(steppedThread, steppedThreadIdx);
            if (nextOps.length == 0) {
                // Set to THREAD_STATE_DONE if on a terminating location
                resultBase = this.setCompState(resultBase, steppedThreadIdx, THREAD_STATE_DONE);
            }

            // Determine and set the next thread to step
            const nextNonObserverThreadToStep: number = this.determineNextNonObserverThreadToStep(resultBase, steppedThreadIdx);

            if (nextOps.length > 0) {
                resultBase = this.setCompState(resultBase, steppedThreadIdx, THREAD_STATE_YIELD);
            }

            if (nextNonObserverThreadToStep > -1) {
                resultBase = this.setCompState(resultBase, nextNonObserverThreadToStep, THREAD_STATE_RUNNING);
            }
        }

        // TODO: Different schedules that were triggered by different events

        // TODO: WaitUntilStatement (should trigger a corresponding hat with ConditionReachedEvent and waits for it)
        // TODO: WaitSecsStatement (also triggers a hat with ConditionReachedEvent and waits for it)
        // TODO: BroadcastAndWaitStatement (triggeres all registered hats and waits for them)

        // TODO: Hats to activate:
        //  - BootStrap
        //  - AfterBootstrap
        //  - Startup
        //  - StartedAsClone
        //  - ReceivedMessage (after a Broadcast op)
        //  - ReachedCondition (after each user-visible state)

        // TODO: Mouse inputs, keyboard inputs, microphone inputs, others?

        // TODO: Produce a state with THREAD_STATE_RUNNING_ATOMIC if isInnerAtomic

        this.checkSchedule(resultBase);

        return [resultBase];
    }

    private checkSchedule(sched: Schedule) {
        let threadIndex = 0;
        for (const ts of sched) {
            const ops = this.resolveLeavingOps(ts, threadIndex);
            if (ts.getComputationState() == THREAD_STATE_RUNNING || ts.getComputationState() == THREAD_STATE_RUNNING_ATOMIC) {
                Preconditions.checkState(ops.length > 0);
            }
            threadIndex++;
        }
    }

    private getAllMessageReceiverThreadsFrom(threadStates: Schedule, msg: string): number[] {
        const result: number[] = [];
        let index = 0;
        for (const t of threadStates) {
            const script = this._task.getActorByName(t.getActorId()).getScript(t.getScriptId());
            if (script.event instanceof MessageReceivedEvent) {
                const ev: MessageReceivedEvent = script.event as MessageReceivedEvent;
                const handled = this.evaluateToConcreteMessage(ev.message);
                if (msg == handled) {
                    result.push(index);
                }
            }
            index++;
        }
        return result;
    }

    private determineNextNonObserverThreadToStep(resultBase: Schedule, steppedThreadIdx: number): number {
        let indexToCheck = (steppedThreadIdx + 1) % resultBase.size;
        let checked = 0;
        while (checked <= resultBase.size) {
            indexToCheck = (indexToCheck + 1) % resultBase.size;
            const threadAtIndex = resultBase.get(indexToCheck);
            if (this.isNonObserverThread(threadAtIndex)) {
                if (threadAtIndex.getComputationState() === THREAD_STATE_RUNNING_ATOMIC) {
                    throw new IllegalStateException("Not expecting this");

                } else if (threadAtIndex.getComputationState() === THREAD_STATE_YIELD) {
                    return indexToCheck;
                }
            }
            checked++;
        }

        // Continue to execute the previously stepped thread of no other
        // is ready to be stepped.
        const stepped = resultBase.get(steppedThreadIdx);
        if (this.isSteppable(stepped)) {
            return steppedThreadIdx;
        } else {
            return -1;
        }
    }

    private isSteppable(thread: ThreadState): boolean {
        return thread.getComputationState() == THREAD_STATE_RUNNING_ATOMIC
            || thread.getComputationState() == THREAD_STATE_RUNNING
            || thread.getComputationState() == THREAD_STATE_YIELD;
    }

    private isNonObserverThread(thread: ThreadState) {
        const actor = this._task.getActorByName(thread.getActorId());
        return !actor.isObserver;
    }

    private evaluateToConcreteMessage(msg: StringExpression) {
        if (msg instanceof StringLiteral) {
            const lit = msg as StringLiteral;
            return lit.text;
        }
        throw new ImplementMeException();
    }

}