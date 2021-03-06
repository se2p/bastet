/*
 *   BASTET Program Analysis and Verification Framework
 *
 *   Copyright 2020 by University of Passau (uni-passau.de)
 *
 *   See the file CONTRIBUTORS.md for the list of contributors.
 *
 *   Please make sure to CITE this work in your publications if you
 *   build on this work. Some of our maintainers or contributors might
 *   be interested in actively CONTRIBUTING to your research project.
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

import {
    ProgramAnalysis,
    ProgramAnalysisWithLabels,
    TransitionLabelProvider,
    WrappingProgramAnalysis
} from "../ProgramAnalysis";
import {AbstractElement, AbstractState} from "../../../lattices/Lattice";
import {Preconditions} from "../../../utils/Preconditions";
import {AnalysisStatistics} from "../AnalysisStatistics";
import {ConcreteElement} from "../../domains/ConcreteElements";
import {Property} from "../../../syntax/Property";
import {FrontierSet, PartitionKey, ReachedSet} from "../../algorithms/StateSet";
import {App} from "../../../syntax/app/App";
import {AbstractDomain} from "../../domains/AbstractDomain";
import {Refiner, Unwrapper, WrappingRefiner} from "../Refiner";
import {LabeledTransferRelation} from "../TransferRelation";
import {ProgramOperation, ProgramOperationInContext} from "../../../syntax/app/controlflow/ops/ProgramOperation";
import {Concern} from "../../../syntax/Concern";
import {ImplementMeException} from "../../../core/exceptions/ImplementMeException";
import {List as ImmList, Set as ImmSet} from "immutable";
import {LexiKey} from "../../../utils/Lexicographic";
import {AccessibilityRelation} from "../Accessibility";
import {LabelAbstractDomain, LabelState} from "./LabelAbstractDomain";
import {LabelTransferRelation} from "./LabelTransferRelation";
import {MergeJoinOperator} from "../Operators";
import {ThreadState} from "../control/ConcreteProgramState";

let bigStepNumber: number = 0; // FIXME: THIS IS A HACK

export function incBigStep() {
    bigStepNumber = bigStepNumber + 1;
}

export class LabelAnalysis<F extends AbstractState>
    implements WrappingProgramAnalysis<ConcreteElement, LabelState, F>,
        TransitionLabelProvider<LabelState>,
        Unwrapper<LabelState, AbstractElement>,
        LabeledTransferRelation<LabelState> {

    private readonly _abstractDomain: LabelAbstractDomain;

    private readonly _wrappedAnalysis: ProgramAnalysis<any, any, F>;

    private readonly _statistics: AnalysisStatistics;

    private readonly _transfer: LabelTransferRelation;

    private readonly _mergeOperator: MergeJoinOperator<LabelState>;

    private readonly _task: App;

    constructor(task: App, wrappedAnalysis: ProgramAnalysisWithLabels<any, any, F>, statistics: AnalysisStatistics) {
        this._task = Preconditions.checkNotUndefined(task);
        this._statistics = Preconditions.checkNotUndefined(statistics).withContext(wrappedAnalysis.constructor.name);
        this._wrappedAnalysis = Preconditions.checkNotUndefined(wrappedAnalysis);
        this._abstractDomain = new LabelAbstractDomain(wrappedAnalysis.abstractDomain);
        this._mergeOperator = new MergeJoinOperator(this._abstractDomain);
        this._transfer = new LabelTransferRelation(wrappedAnalysis, () => bigStepNumber);
    }

    getTransitionLabel(fromState: LabelState, toState: LabelState): [ThreadState, ProgramOperation][] {
        const relevantBigSteps = new Set<number>(toState.getTransfers().map((t) => t.getBigStep()));

        const worklist: [LabelState, [ThreadState, ProgramOperation][]][] = [];
        worklist.push([toState, []]);

        let otherwise: [ThreadState, ProgramOperation][] = [];

        while (worklist.length > 0) {
            const [work, workOps] = worklist.pop();
            for (const transfer of work.getTransfers()) {
                if (relevantBigSteps.has(transfer.getBigStep())) {
                    const opic: [ThreadState, ProgramOperation] = ([transfer.getThreadState(), transfer.getOp()]);
                    const workOpsPrime: [ThreadState, ProgramOperation][] = [opic].concat(workOps);
                    const from = transfer.getFrom() as LabelState;

                    if (from === fromState) {
                        return workOpsPrime;
                    } else if (from.getTransfers().filter(t => relevantBigSteps.has(t.getBigStep())).isEmpty()) {
                        otherwise = workOpsPrime;
                    } else {
                        worklist.push([from, workOpsPrime]);
                    }
                }
            }
        }

        return otherwise;
    }

    abstractSucc(fromState: LabelState): Iterable<LabelState> {
        return this._transfer.abstractSucc(fromState);
    }

    abstractSuccFor(fromState: LabelState, op: ProgramOperationInContext, co: Concern): Iterable<LabelState> {
        return this._transfer.abstractSuccFor(fromState, op, co);
    }

    initialStatesFor(task: App): LabelState[] {
        Preconditions.checkArgument(task === this._task);
        return this._wrappedAnalysis.initialStatesFor(task).map((w) => {
            return new LabelState(ImmList([]), w);
        } );
    }

    join(state1: LabelState, state2: LabelState): LabelState {
        return this._abstractDomain.lattice.join(state1, state2);
    }

    merge(state1: LabelState, state2: LabelState): LabelState {
        return this._mergeOperator.merge(state1, state2);
    }

    shouldMerge(state1: LabelState, state2: LabelState): boolean {
        return this._mergeOperator.shouldMerge(state1, state2);
    }

    stop(state: LabelState, reached: Iterable<F>, unwrapper: (e: F) => LabelState): boolean {
        return this._wrappedAnalysis.stop(state.getWrappedState(), reached, (x) => this.unwrap(unwrapper(x)));
    }

    target(state: LabelState): Property[] {
        return this._wrappedAnalysis.target(state.getWrappedState());
    }

    isWideningState(state: LabelState): boolean {
        return this._wrappedAnalysis.isWideningState(state.getWrappedState());
    }

    widen(state: LabelState, reached: Iterable<F>): LabelState {
        const wrappedResult = this._wrappedAnalysis.widen(state.getWrappedState(), reached);
        if (wrappedResult != state.getWrappedState()) {
            return state.withWrappedState(wrappedResult);
        } else {
            return state;
        }
    }

    createStateSets(): [FrontierSet<F>, ReachedSet<F>] {
        return this._wrappedAnalysis.createStateSets();
    }

    get abstractDomain(): AbstractDomain<ConcreteElement, LabelState> {
        return this._abstractDomain;
    }

    get refiner(): Refiner<F> {
        return new WrappingRefiner(this._wrappedAnalysis.refiner);
    }

    get wrappedAnalysis(): ProgramAnalysis<any, any, F> {
        return this._wrappedAnalysis;
    }

    unwrap(e: LabelState): AbstractElement {
        return e.getWrappedState();
    }

    mergeInto(state: LabelState, frontier: FrontierSet<F>, reached: ReachedSet<F>, unwrapper: (F) => LabelState, wrapper: (LabelState) => F): [FrontierSet<F>, ReachedSet<F>] {
        throw new ImplementMeException();
    }

    widenPartitionOf(ofState: LabelState, reached: ReachedSet<F>): Iterable<F> {
        throw new ImplementMeException();
    }

    stopPartitionOf(ofState: LabelState, reached: ReachedSet<F>): Iterable<F> {
        throw new ImplementMeException();
    }

    mergePartitionOf(ofState: LabelState, reached: ReachedSet<F>): Iterable<F> {
        throw new ImplementMeException();
    }

    getPartitionKeys(element: LabelState): ImmSet<PartitionKey> {
        return this._wrappedAnalysis.getPartitionKeys(element.getWrappedState());
    }

    handleViolatingState(reached: ReachedSet<F>, violating: F) {
        throw new ImplementMeException();
    }

    compareStateOrder(a: LabelState, b: LabelState): number {
        throw new ImplementMeException();
    }

    getLexiOrderKey(ofState: LabelState): LexiKey {
        return this._wrappedAnalysis.getLexiOrderKey(ofState.getWrappedState());
    }

    getLexiDiffKey(ofState: LabelState): LexiKey {
        return this._wrappedAnalysis.getLexiDiffKey(ofState.getWrappedState());
    }

    finalizeResults(frontier: FrontierSet<F>, reached: ReachedSet<F>) {
        return this.wrappedAnalysis.finalizeResults(frontier, reached);
    }

    testify(accessibility: AccessibilityRelation< F>, state: F): AccessibilityRelation< F> {
        return this.wrappedAnalysis.testify(accessibility, state);
    }

    testifyConcrete(accessibility: AccessibilityRelation< F>, state: F): Iterable<[F, ConcreteElement][]> {
        return this.wrappedAnalysis.testifyConcrete(accessibility, state);
    }

    testifyConcreteOne(accessibility: AccessibilityRelation< F>, state: F): Iterable<[F, ConcreteElement][]> {
        return this.wrappedAnalysis.testifyConcreteOne(accessibility, state);
    }

    testifyOne(accessibility: AccessibilityRelation< F>, state: F): AccessibilityRelation< F> {
        return this.wrappedAnalysis.testifyOne(accessibility, state);
    }

    accessibility(reached: ReachedSet<F>, state: F): AccessibilityRelation<F> {
        throw new ImplementMeException();
    }

    incRef(state: LabelState) {
        this.wrappedAnalysis.incRef(state.getWrappedState());
    }

    decRef(state: LabelState) {
        this.wrappedAnalysis.decRef(state.getWrappedState());
    }

}
