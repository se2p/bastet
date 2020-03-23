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

import {AbstractDomain, AbstractionPrecision} from "../../domains/AbstractDomain";
import {AbstractElement, AbstractElementVisitor, Lattice, AbstractState} from "../../../lattices/Lattice";
import {ImplementMeException} from "../../../core/exceptions/ImplementMeException";
import {List as ImmList, Record as ImmRec, Set as ImmSet} from "immutable"
import {SingletonStateWrapper} from "../AbstractStates";
import {ConcreteDomain, ConcreteElement} from "../../domains/ConcreteElements";
import {Preconditions} from "../../../utils/Preconditions";
import {PartitionKeyElement} from "../../algorithms/StateSet";

export type GraphStateId = number;

export interface GraphConcreteState extends ConcreteElement {

}

export interface GraphAbstractStateAttribs extends AbstractElement, SingletonStateWrapper {

    id: GraphStateId;

    predecessors: ImmSet<GraphStateId>;

    mergeOf: ImmSet<GraphStateId>;

    wrappedState: ImmRec<any>;

    partitionKey: ImmList<PartitionKeyElement>;

}

const GraphAbstractStateRecord = ImmRec({
    id: 0,
    predecessors: ImmSet<GraphStateId>([]),
    wrappedState: null,
    mergeOf: ImmSet<GraphStateId>([]),
    partitionKey: ImmList()
});

export class GraphAbstractState extends GraphAbstractStateRecord implements GraphAbstractStateAttribs, AbstractState {

    constructor(id: GraphStateId, preds: ImmSet<GraphStateId>, mergeOf: ImmSet<GraphStateId>, wrapped: ImmRec<any>,
                partitionKey: ImmList<PartitionKeyElement>) {
        super({id: id, predecessors: preds, wrappedState: wrapped, mergeOf: mergeOf, partitionKey: partitionKey});
    }

    public getId(): number {
        return this.get('id');
    }

    public getPredecessors(): ImmSet<GraphStateId> {
        return this.get('predecessors');
    }

    public getMergeOf(): ImmSet<GraphStateId> {
        return this.get('mergeOf');
    }

    public getWrappedState(): AbstractState {
        return this.get('wrappedState');
    }

    public getPartitionKey(): ImmList<PartitionKeyElement> {
        return this.get('partitionKey');
    }

    public accept<R>(visitor: AbstractElementVisitor<R>): R {
        const visitMethod: string = `visit${this.constructor.name}`;
        if (visitor[visitMethod]) {
            return visitor[visitMethod](this);
        } else {
            return visitor.visit(this);
        }
    }
}

export class GraphAbstractStateFactory {

    private static STATE_ID_SEQ: number;

    public static withFreshID(preds: Iterable<GraphStateId>, mergeOf: Iterable<GraphStateId>, wrapped: ImmRec<any>,
                              wrappedKey: ImmList<PartitionKeyElement>): GraphAbstractState {
        if (!GraphAbstractStateFactory.STATE_ID_SEQ) {
            GraphAbstractStateFactory.STATE_ID_SEQ = 0;
        }
        const freshId = GraphAbstractStateFactory.STATE_ID_SEQ++;
        return new GraphAbstractState(freshId, ImmSet(preds), ImmSet(mergeOf).union([freshId]), wrapped, ImmList(wrappedKey));
    }

}

export class GraphAbstractStateLattice implements Lattice<GraphAbstractState> {

    private readonly _wrappedLattice: Lattice<AbstractElement>;

    constructor(wrappedLattice: Lattice<AbstractElement>) {
        this._wrappedLattice = Preconditions.checkNotUndefined(wrappedLattice);
    }

    bottom(): GraphAbstractState {
        throw new ImplementMeException();
    }

    isIncluded(element1: GraphAbstractState, element2: GraphAbstractState): boolean {
        throw new ImplementMeException();
    }

    join(element1: GraphAbstractState, element2: GraphAbstractState): GraphAbstractState {
        return GraphAbstractStateFactory.withFreshID(
            element1.getPredecessors().union(element2.getPredecessors()),
            element1.getMergeOf().union(element2.getMergeOf()),
            this._wrappedLattice.join(element1.getWrappedState(), element2.getWrappedState()),
            element1.getPartitionKey());
    }

    meet(element1: GraphAbstractState, element2: GraphAbstractState): GraphAbstractState {
        throw new ImplementMeException();
    }

    top(): GraphAbstractState {
        throw new ImplementMeException();
    }
}

export class GraphAbstractDomain implements AbstractDomain<GraphConcreteState, GraphAbstractState> {

    private readonly _lattice: GraphAbstractStateLattice;
    private readonly _wrapped: AbstractDomain<ConcreteElement, AbstractElement>;

    constructor(wrapped: AbstractDomain<ConcreteElement, AbstractElement>) {
        this._wrapped = Preconditions.checkNotUndefined(wrapped);
        this._lattice = new GraphAbstractStateLattice(wrapped.lattice);
    }

    get lattice(): Lattice<GraphAbstractState> {
        return this._lattice;
    }

    abstract(elements: Iterable<GraphConcreteState>): GraphAbstractState {
        throw new ImplementMeException();
    }

    concretize(element: GraphAbstractState): Iterable<GraphConcreteState> {
        throw new ImplementMeException();
    }

    widen(element: GraphAbstractState, precision: AbstractionPrecision): GraphAbstractState {
        throw new ImplementMeException();
    }

    get concreteDomain(): ConcreteDomain<GraphConcreteState> {
        throw new ImplementMeException();
    }
}
