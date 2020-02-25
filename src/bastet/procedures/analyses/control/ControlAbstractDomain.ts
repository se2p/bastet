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

import {SingletonStateWrapper} from "../AbstractStates";
import {AbstractDomain, AbstractionPrecision} from "../../domains/AbstractDomain";
import {AbstractElement, Lattice} from "../../../lattices/Lattice";
import {List as ImmList, Record as ImmRec, Set as ImmSet} from "immutable";
import {ActorId} from "../../../syntax/app/Actor";
import {LocationID} from "../../../syntax/app/controlflow/ControlLocation";
import {ScriptId} from "../../../syntax/app/controlflow/Script";
import {ImplementMeException} from "../../../core/exceptions/ImplementMeException";
import {ConcreteDomain} from "../../domains/ConcreteElements";
import {App} from "../../../syntax/app/App";
import {BootstrapEvent} from "../../../syntax/ast/core/CoreEvent";
import {Property} from "../../../syntax/Property";

export const THREAD_STATE_RUNNING = 1;
export const THREAD_STATE_RUNNING_ATOMIC = 2;
export const THREAD_STATE_WAIT = 3;
export const THREAD_STATE_DONE = 4;
export const THREAD_STATE_YIELD = 5;
export const THREAD_STATE_FAILURE = 6;
export const THREAD_STATE_UNKNOWN = 0;

export type ScriptComputationState = number;

export type ThreadId = number;

export interface ControlConcreteState {

}

export interface MethodCallAttributes {

    /**
     * Control location from that the method has been called
     */
    callFrom: LocationID;


    /**
     * Control location to that the method call is supposed to
     * return to after the method is finished
     */
    returnTo: LocationID;

}

const MethodCallRecord = ImmRec({
    callFrom: 0,
    returnTo: 0
});

export class MethodCall extends MethodCallRecord implements MethodCallAttributes {

    constructor(callFrom: LocationID, returnTo: LocationID) {
        super({callFrom: callFrom, returnTo: returnTo});
    }

    public getCallFrom(): LocationID {
        return this.get('callFrom');
    }

    public getReturnTo(): LocationID {
        return this.get('returnTo');
    }
}

export interface ThreadStateAttributes {

    /** Unique identifier of the actor */
    actorId: ActorId;

    /** Unique identifier of the thread */
    threadId: ThreadId;

    /** Computation state of the thread */
    computationState: ScriptComputationState;

    /** Set of threads this thread is waiting for before it can continue */
    waitingForThreads: ImmSet<ThreadId>;

    /** Unique identifier of the script */
    scriptId: ScriptId;

    /** Identifier of the control location (position in the transition system of the script) */
    locationId: LocationID;

    /** Set of properties for that the thread ran into a failing control location (ERROR location) */
    failedFor: ImmSet<Property>;

    /** Stack of method call and return locations to enable the inter-procedural analysis */
    returnCallTo: ImmList<MethodCall>;

    /** Scope to uniquely identify currently declared and references variables (data locations) */
    scopeStack: ImmList<string>;

}

const ThreadStateRecord = ImmRec({
    threadId: -1,
    actorId: "",
    scriptId: -1,
    locationId: -1,
    computationState: THREAD_STATE_UNKNOWN,
    waitingForThreads: ImmSet<ThreadId>(),
    failedFor: ImmSet<Property>(),
    returnCallTo: ImmList<MethodCall>(),
    scopeStack: ImmList<string>()
});

export class ThreadState extends ThreadStateRecord implements AbstractElement, ThreadStateAttributes {

    constructor(threadId: ThreadId, actorId: ActorId, scriptId: ScriptId, locationId: LocationID,
                compState: ScriptComputationState, waitingForThreads: ImmSet<ThreadId>,
                failedFor: ImmSet<Property>, returnCallTo: ImmList<MethodCall>) {
        super({threadId: threadId, actorId: actorId, scriptId: scriptId,
            locationId: locationId, computationState: compState,
            waitingForThreads: waitingForThreads, failedFor: failedFor, returnCallTo: returnCallTo});
    }

    public getThreadId(): ThreadId {
        return this.get('threadId');
    }

    public getActorId(): ActorId {
        return this.get('actorId');
    }

    public getScriptId(): ScriptId {
        return this.get('scriptId');
    }

    public getLocationId(): LocationID {
        return this.get('locationId');
    }

    public getReturnCallTo(): ImmList<MethodCall> {
        return this.get('returnCallTo');
    }

    public getScopeStack(): ImmList<string> {
        return this.get('scopeStack');
    }

    public withLocationId(value: LocationID): ThreadState {
        return this.set('locationId', value);
    }

    public getComputationState(): ScriptComputationState {
        return this.get('computationState');
    }

    public withComputationState(value: ScriptComputationState): ThreadState {
        return this.set('computationState', value);
    }

    public getWaitingForThreads(): ImmSet<ThreadId> {
        return this.get('waitingForThreads');
    }

    public getFailedFor(): ImmSet<Property> {
        return this.get('failedFor');
    }

    public withWaitingForThreads(value: ImmSet<ThreadId>): ThreadState {
        return this.set('waitingForThreads', value);
    }

    public withReturnCallTo(value: ImmList<MethodCall>): ThreadState {
        return this.set('returnCallTo', value);
    }

    public withFailedFor(value: ImmSet<Property>): ThreadState {
        return this.set('failedFor', value);
    }

    public withScopeStack(value: ImmList<string>): ThreadState {
        return this.set('scopeStack', value);
    }

}

export class ThreadStateFactory {

    private static THREAD_ID_SEQ: number;

    public static freshId(): number {
        if (!ThreadStateFactory.THREAD_ID_SEQ) {
            ThreadStateFactory.THREAD_ID_SEQ = 0;
        }
        return ThreadStateFactory.THREAD_ID_SEQ++;
    }

    public static createRunningThread(actorId: ActorId,
                                      scriptId: ScriptId, locationId: LocationID): ThreadState {
        const threadId = this.freshId();
        return new ThreadState(threadId, actorId, scriptId, locationId,
            THREAD_STATE_RUNNING, ImmSet(), ImmSet(), ImmList());
    }

}

export interface ControlAbstractStateAttributes extends AbstractElement, SingletonStateWrapper {

    /** Set of properties for that the abstract state is a target state (computed, for faster lookup) */
    isTargetFor: ImmSet<Property>;

    /** List of threads and their states */
    threadStates: ImmList<ThreadState>;

    /** Wrapped abstract state that stores the actual data of heap and stack */
    wrappedState: AbstractElement;

}

const ControlAbstractStateRecord = ImmRec({

    threadStates: ImmList<ThreadState>([]),

    wrappedState: null,

    isTargetFor: ImmSet()

});


/**
 * A state with SHARED MEMORY
 */
export class ControlAbstractState extends ControlAbstractStateRecord implements AbstractElement {

    constructor(threadStates: ImmList<ThreadState>, wrappedState: AbstractElement, isTargetFor: ImmSet<Property>) {
        super({threadStates: threadStates, wrappedState: wrappedState, isTargetFor: isTargetFor});
    }

    public getThreadStates(): ImmList<ThreadState> {
        return this.get("threadStates");
    }

    public getWrappedState(): AbstractElement {
        return this.get("wrappedState");
    }

    public getIsTargetFor(): ImmSet<Property> {
        return this.get("isTargetFor");
    }
}

export class ScheduleAbstractStateFactory {

    public static createState(threadStates: ImmList<ThreadState>, wrappedStated: ImmRec<any>, isTargetFor: ImmSet<Property>): ControlAbstractState {
        return new ControlAbstractState(threadStates, wrappedStated, isTargetFor);
    }

    static createInitialState(task: App, wrappedState: ImmRec<any>, isTarget) {
        let threads = ImmList<ThreadState>([]);
        for (const actor of task.actors) {
            for (const script of actor.scripts) {
                const threadId = ThreadStateFactory.freshId();
                let threadState = THREAD_STATE_WAIT;
                if (script.event === BootstrapEvent.instance()) {
                    threadState = THREAD_STATE_RUNNING;
                }
                for (const locId of script.transitions.entryLocationSet) {
                    threads = threads.push(new ThreadState(threadId, actor.ident, script.id, locId,
                        threadState, ImmSet(), ImmSet(), ImmList()));
                }
            }
        }

        return new ControlAbstractState(threads, wrappedState, isTarget);
    }
}

export class ControlAbstractDomain implements AbstractDomain<ControlConcreteState, ControlAbstractState> {

    lattice: Lattice<ControlAbstractState>;

    abstract(elements: Iterable<ControlConcreteState>): ControlAbstractState {
        throw new ImplementMeException();
    }

    concretize(element: ControlAbstractState): Iterable<ControlConcreteState> {
        throw new ImplementMeException();
    }

    widen(element: ControlAbstractState, precision: AbstractionPrecision): ControlAbstractState {
        throw new ImplementMeException();
    }

    get concreteDomain(): ConcreteDomain<ControlConcreteState> {
        throw new ImplementMeException();
    }

}