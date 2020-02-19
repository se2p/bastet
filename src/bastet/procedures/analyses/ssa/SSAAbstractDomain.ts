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
import {AbstractElement, Lattice} from "../../../lattices/Lattice";
import {ImplementMeException} from "../../../core/exceptions/ImplementMeException";
import {Map as ImmMap, Record as ImmRec} from "immutable"
import {SingletonStateWrapper} from "../AbstractStates";
import {ConcreteDomain, ConcreteElement} from "../../domains/ConcreteElements";
import {ScratchTypeID} from "../../../syntax/ast/core/ScratchType";
import {Preconditions} from "../../../utils/Preconditions";


export interface SSAStateAttribs extends AbstractElement, SingletonStateWrapper {

    ssa: ImmMap<string, number>;

    declared: ImmMap<string, ScratchTypeID>;

    wrappedState: AbstractElement;

}

const SSAStateRecord = ImmRec({

    ssa: ImmMap<string, number>(),

    declared: ImmMap<string, ScratchTypeID>(),

    wrappedState: null

});

export const NOT_DECLARED_INDEX = 0;
export const INITIALLY_DECLARED_INDEX = NOT_DECLARED_INDEX + 1;

export class SSAState extends SSAStateRecord implements SSAStateAttribs {

    constructor(ssa: ImmMap<string, number>, declared: ImmMap<string, ScratchTypeID>, wrapped: AbstractElement) {
        super({ssa: ssa, declared: declared, wrappedState: wrapped});
    }

    public getSSA(): ImmMap<string, number> {
        return this.get("ssa");
    }

    public getWrappedState(): AbstractElement {
        return this.get("wrappedState");
    }

    public getIndex(ofDataLocation: string): number {
        return this.getSSA().get(ofDataLocation, NOT_DECLARED_INDEX);
    }

    public withIndex(ofDataLocation: string, index: number): SSAState {
        const newSSA = this.getSSA().set(ofDataLocation, index);
        return this.withSSA(newSSA);
    }

    public withSSA(ssa: ImmMap<string, number>): SSAState {
        return this.set("ssa", ssa);
    }

    public withDeclarations(declared: ImmMap<string, ScratchTypeID>): SSAState {
        return this.set("declared", declared);
    }

    public withWrappedState(wrapped: AbstractElement): SSAState {
        return this.set("wrappedState", wrapped);
    }

    public withDeclaration(declarationOf: string): SSAState {
        const [newState, newIndex] = this.withAssignment(declarationOf);
        return newState;
    }

    public withAssignment(assignementTo: string): [SSAState, number] {
        const newIndex = this.getIndex(assignementTo) + 1;
        const result = this.withIndex(assignementTo, newIndex);
        return [result, newIndex];
    }

}

export class SSAStateLattice implements Lattice<SSAState> {

    private readonly _wrappedStateLattice: Lattice<AbstractElement>;

    private readonly _bottom: SSAState;

    private readonly _top: SSAState;

    constructor(wrappedStateLattice: Lattice<AbstractElement>) {
        this._wrappedStateLattice = Preconditions.checkNotUndefined(wrappedStateLattice);
        this._bottom = new SSAState(ImmMap({}), ImmMap({}), wrappedStateLattice.bottom());
        this._top = new SSAState(ImmMap({}), ImmMap({}), wrappedStateLattice.top());
    }

    bottom(): SSAState {
        return this._bottom;
    }

    isIncluded(element1: SSAState, element2: SSAState): boolean {
        throw new ImplementMeException();
    }

    join(element1: SSAState, element2: SSAState): SSAState {
        throw new ImplementMeException();
    }

    meet(element1: SSAState, element2: SSAState): SSAState {
        throw new ImplementMeException();
    }

    top(): SSAState {
        return this._top;
    }
}

export class SSAAbstractDomain implements AbstractDomain<ConcreteElement, SSAState> {

    private readonly _lattice: SSAStateLattice;
    private readonly _wrapped: AbstractDomain<ConcreteElement, AbstractElement>;

    constructor(wrapped: AbstractDomain<ConcreteElement, AbstractElement>) {
        Preconditions.checkNotUndefined(wrapped);
        this._lattice = new SSAStateLattice(wrapped.lattice);
        this._wrapped = wrapped;
    }

    get lattice(): Lattice<SSAState> {
        return this._lattice;
    }

    abstract(elements: Iterable<ConcreteElement>): SSAState {
        throw new ImplementMeException();
    }

    concretize(element: SSAState): Iterable<ConcreteElement> {
        throw new ImplementMeException();
    }

    widen(element: SSAState, precision: AbstractionPrecision): SSAState {
        throw new ImplementMeException();
    }

    get concreteDomain(): ConcreteDomain<ConcreteElement> {
        throw new ImplementMeException();
    }
}