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

import {MergeOperator, ProgramAnalysisWithLabels, WidenOperator} from "../ProgramAnalysis";
import {AbstractDomain} from "../../domains/AbstractDomain";
import {App} from "../../../syntax/app/App";
import {AbstractElement, AbstractState} from "../../../lattices/Lattice";
import {Preconditions} from "../../../utils/Preconditions";
import {ConcreteElement} from "../../domains/ConcreteElements";
import {LabeledTransferRelation} from "../TransferRelation";
import {ProgramOperation} from "../../../syntax/app/controlflow/ops/ProgramOperation";
import {Refiner, Unwrapper, WrappingRefiner} from "../Refiner";
import {Property} from "../../../syntax/Property";
import {FrontierSet, PartitionKey, ReachedSet, StateSet} from "../../algorithms/StateSet";
import {AnalysisStatistics} from "../AnalysisStatistics";
import {Concern} from "../../../syntax/Concern";
import {ImplementMeException, ImplementMeForException} from "../../../core/exceptions/ImplementMeException";
import {BastetConfiguration} from "../../../utils/BastetConfiguration";
import {Map as ImmMap, Set as ImmSet} from "immutable";
import {LexiKey} from "../../../utils/Lexicographic";
import {AccessibilityRelation} from "../Accessibility";
import {AbstractionAbstractDomain, AbstractionState} from "./AbstractionAbstractDomain";
import {AbstractionTransferRelation} from "./AbstractionTransferRelation";
import {AbstractionMergeOperator} from "./AbstractionMergeOperator";
import {FirstOrderLattice} from "../../domains/FirstOrderDomain";
import {FirstOrderFormula} from "../../../utils/ConjunctiveNormalForm";
import {AbstractionRefiner} from "./AbstractionRefiner";
import {AbstractionWideningOperator} from "./AbstractionWideningOperator";
import {
    BooleanPredicateAbstraction,
    CartesianPredicateAbstraction,
    PredicateAbstraction
} from "./AbstractionComputation";


export class AbstractionAnalysisConfig extends BastetConfiguration {

    constructor(dict: {}) {
        super(dict, ['AbstractionAnalysis']);
    }

    get abstractionType(): string {
        return this.getStringProperty('abstraction-type', "boolean").toLowerCase();
    }
}

export class AbstractionAnalysis implements ProgramAnalysisWithLabels<ConcreteElement, AbstractionState, AbstractState>,
    LabeledTransferRelation<AbstractionState>,
    Unwrapper<AbstractionState, AbstractElement> {

    private readonly _abstractDomain: AbstractionAbstractDomain;

    private readonly _wrappedAnalysis: ProgramAnalysisWithLabels<any, AbstractState, AbstractState>;

    private readonly _transferRelation: AbstractionTransferRelation;

    private readonly _refiner: AbstractionRefiner;

    private readonly _task: App;

    private readonly _statistics: AnalysisStatistics;

    private readonly _mergeOp: MergeOperator<AbstractionState>;

    private readonly _config: AbstractionAnalysisConfig;

    private readonly _widen: WidenOperator<AbstractionState, AbstractState>;

    constructor(config: {}, task: App, summaryLattice: FirstOrderLattice<FirstOrderFormula>,
                wrappedAnalysis: ProgramAnalysisWithLabels<any, any, AbstractState>,
                statistics: AnalysisStatistics) {
        this._config = new AbstractionAnalysisConfig(config);
        this._task = Preconditions.checkNotUndefined(task);
        this._wrappedAnalysis = Preconditions.checkNotUndefined(wrappedAnalysis);
        this._abstractDomain = new AbstractionAbstractDomain(wrappedAnalysis.abstractDomain, summaryLattice);

        this._transferRelation = new AbstractionTransferRelation(wrappedAnalysis);

        this._refiner = new AbstractionRefiner(this, this._abstractDomain.lattice, this);

        this._statistics = Preconditions.checkNotUndefined(statistics).withContext(this.constructor.name);
        this._mergeOp = new AbstractionMergeOperator(this._task, this.wrappedAnalysis, this.wrappedAnalysis);

        let abstractionComp: PredicateAbstraction;
        if (this._config.abstractionType == "boolean") {
            abstractionComp = new BooleanPredicateAbstraction(summaryLattice);
        } else if (this._config.abstractionType == "cartesian") {
            abstractionComp = new CartesianPredicateAbstraction(summaryLattice);
        } else {
            throw new ImplementMeException();
        }

        this._widen = new AbstractionWideningOperator(abstractionComp, this._refiner);
    }

    getTransitionLabel(from: AbstractionState, to: AbstractionState): ProgramOperation[] {
        return this._wrappedAnalysis.getTransitionLabel(from.getWrappedState(), to.getWrappedState());
    }

    abstractSucc(fromState: AbstractionState): Iterable<AbstractionState> {
        return this._transferRelation.abstractSucc(fromState);
    }

    abstractSuccFor(fromState: AbstractionState, op: ProgramOperation, co: Concern): Iterable<AbstractionState> {
        return this._transferRelation.abstractSuccFor(fromState, op, co);
    }

    join(state1: AbstractionState, state2: AbstractionState): AbstractionState {
        return this._abstractDomain.lattice.join(state1, state2);
    }

    shouldMerge(state1: AbstractionState, state2: AbstractionState): boolean {
        return this._mergeOp.shouldMerge(state1, state2);
    }

    merge(state1: AbstractionState, state2: AbstractionState): AbstractionState {
        return this._mergeOp.merge(state1, state2);
    }

    stop(state: AbstractionState, reached: Iterable<AbstractState>, unwrapper: (AbstractState) => AbstractionState): boolean {
        throw new ImplementMeForException("Impl. as described in the paper; might also take the wrapped stop op into account.")
    }

    target(state: AbstractionState): Property[] {
        return this._wrappedAnalysis.target(state.wrappedState);
    }

    widen(state: AbstractionState, reached: Iterable<AbstractState>): AbstractionState {
        return this._widen.widen(state, reached);
    }

    unwrap(e: AbstractionState): AbstractElement {
        return e.getWrappedState();
    }

    get refiner(): Refiner<AbstractionState, AbstractState> {
        return this._refiner;
    }

    get abstractDomain(): AbstractDomain<ConcreteElement, AbstractionState> {
        return this._abstractDomain;
    }

    get wrappedAnalysis(): ProgramAnalysisWithLabels<any, any, AbstractState> {
        return this._wrappedAnalysis;
    }

    initialStatesFor(task: App): AbstractionState[] {
        Preconditions.checkArgument(task === this._task);
        return this._wrappedAnalysis.initialStatesFor(task).map((w) => {
            return new AbstractionState(this._abstractDomain.lattice.summaryLattice.top(), w);
        } );
    }

    createStateSets(): [FrontierSet<AbstractState>, ReachedSet<AbstractState>] {
        return this.wrappedAnalysis.createStateSets();
    }

    mergeInto(state: AbstractionState, frontier: StateSet<AbstractState>, reached: ReachedSet<AbstractState>, unwrapper: (AbstractState) => AbstractionState, wrapper: (E) => AbstractState): [FrontierSet<AbstractState>, ReachedSet<AbstractState>] {
        throw new ImplementMeException();
    }

    widenPartitionOf(ofState: AbstractionState, reached: ReachedSet<AbstractState>): Iterable<AbstractState> {
        throw new ImplementMeException();
    }

    stopPartitionOf(ofState: AbstractionState, reached: ReachedSet<AbstractState>): Iterable<AbstractState> {
        throw new ImplementMeException();
    }

    mergePartitionOf(ofState: AbstractionState, reached: ReachedSet<AbstractState>): Iterable<AbstractState> {
        throw new ImplementMeException();
    }

    getPartitionKeys(element: AbstractionState): ImmSet<PartitionKey> {
        return this._wrappedAnalysis.getPartitionKeys(element.getWrappedState());
    }

    handleViolatingState(reached: ReachedSet<AbstractState>, violating: AbstractState) {
        throw new ImplementMeException();
    }

    compareStateOrder(a: AbstractionState, b: AbstractionState): number {
        throw new ImplementMeException();
    }

    getLexiOrderKey(ofState: AbstractionState): LexiKey {
        return this._wrappedAnalysis.getLexiOrderKey(ofState.getWrappedState());
    }

    getLexiDiffKey(ofState: AbstractionState): LexiKey {
        return this._wrappedAnalysis.getLexiDiffKey(ofState.getWrappedState());
    }

    finalizeResults(frontier: FrontierSet<AbstractState>, reached: ReachedSet<AbstractState>) {
        return this.wrappedAnalysis.finalizeResults(frontier, reached);
    }

    testify(accessibility: AccessibilityRelation<AbstractionState, AbstractState>, state: AbstractState): AccessibilityRelation<AbstractionState, AbstractState> {
        return this.wrappedAnalysis.testify(accessibility, state);
    }

    testifyOne(accessibility: AccessibilityRelation<AbstractionState, AbstractState>, state: AbstractState): AccessibilityRelation<AbstractionState, AbstractState> {
        return this.wrappedAnalysis.testifyOne(accessibility, state);
    }

    testifyConcrete(accessibility: AccessibilityRelation<AbstractionState, AbstractState>, state: AbstractState): Iterable<ConcreteElement[]> {
        throw new ImplementMeException();
    }

    testifyConcreteOne(accessibility: AccessibilityRelation<AbstractionState, AbstractState>, state: AbstractState): Iterable<ConcreteElement[]> {
        const resultWithSSA = this.wrappedAnalysis.testifyConcreteOne(accessibility, state);

        // TODO: Remove the SSA-Indices from the concrete elements along the path
        throw new ImplementMeException();
    }

    accessibility(reached: ReachedSet<AbstractState>, state: AbstractState): AccessibilityRelation<AbstractionState, AbstractState> {
        throw new ImplementMeException();
    }

}
