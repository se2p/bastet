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

import {ProgramAnalysis, ProgramAnalysisWithLabels} from "../ProgramAnalysis";
import {SyMemAbstractDomain, SymMemAbstractState } from "./SyMemAbstractDomain";
import {AbstractDomain} from "../../domains/AbstractDomain";
import {StateSet} from "../../algorithms/StateSet";
import {App} from "../../../syntax/app/App";
import {LabeledTransferRelation} from "../TransferRelation";
import {ProgramOperation} from "../../../syntax/app/controlflow/ops/ProgramOperation";
import {SyMemTransferRelation} from "./SyMemTransferRelation";
import {ImplementMeException} from "../../../core/exceptions/ImplementMeException";
import {
    ConcreteBooleanDomain,
    ConcreteBoundedStringDomain, ConcreteBoundedStringListDomain,
    ConcreteMemory,
    ConcreteNumberDomain
} from "../../domains/ConcreteElements";
import {NumIntervalTheory, NumIntervalValueDomain} from "../../domains/NumIntervalValueDomain";
import {FlatBooleanValueDomain, FlatBooleanValueTheory} from "../../domains/FlatBooleanValueDomain";
import {OurStringListTheory, StringListAbstractDomain} from "../../domains/StringListAbstractDomain";
import {OurStringTheory, StringAbstractDomain} from "../../domains/StringAbstractDomain";
import {Preconditions} from "../../../utils/Preconditions";
import {Z3Solver} from "../../../utils/z3wrapper/Z3Wrapper";
import {
    AbstractBoolean,
    AbstractList,
    AbstractNumber,
    AbstractString,
    AbstractMemoryTheory
} from "../../domains/MemoryTransformer";
import {
    BooleanFormula,
    FirstOrderFormula,
    ListFormula,
    NumberFormula,
    StringFormula
} from "../../../utils/ConjunctiveNormalForm";
import {PropositionalFormula} from "../../../utils/bdd/BDD";
import {Lattice} from "../../../lattices/Lattice";

export class SyMemAnalysis implements ProgramAnalysisWithLabels<ConcreteMemory, SymMemAbstractState>, LabeledTransferRelation<SymMemAbstractState> {

    private readonly _theories: AbstractMemoryTheory<FirstOrderFormula, BooleanFormula, NumberFormula, StringFormula, ListFormula>;
    private readonly _abstractDomain: SyMemAbstractDomain;
    private readonly _transferRelation: SyMemTransferRelation;

    constructor(folLattice: Lattice<FirstOrderFormula>, propLattice: Lattice<PropositionalFormula>,
                theories: AbstractMemoryTheory<FirstOrderFormula, BooleanFormula, NumberFormula, StringFormula, ListFormula>) {
        this._abstractDomain = new SyMemAbstractDomain(folLattice, propLattice);
        this._transferRelation = new SyMemTransferRelation(this._abstractDomain, this._theories);
    }

    abstractSucc(fromState: SymMemAbstractState): Iterable<SymMemAbstractState> {
        return this._transferRelation.abstractSucc(fromState);
    }

    join(state1: SymMemAbstractState, state2: SymMemAbstractState): SymMemAbstractState {
        return this._abstractDomain.lattice.join(state1, state2);
    }

    merge(state1: SymMemAbstractState, state2: SymMemAbstractState): boolean {
        // MERGE-SEP
        return false;
    }

    stop(state: SymMemAbstractState, reached: Iterable<SymMemAbstractState>): boolean {
        for (const r of reached) {
            if (r.equals(state)) {
                return true;
            }
        }
        return false;
    }

    target(state: SymMemAbstractState): boolean {
        return false;
    }

    widen(state: SymMemAbstractState): SymMemAbstractState {
        return state;
    }

    initialStatesFor(task: App): SymMemAbstractState[] {
        return [this._abstractDomain.lattice.top()];
    }

    abstractSuccFor(fromState: SymMemAbstractState, op: ProgramOperation): Iterable<SymMemAbstractState> {
        Preconditions.checkNotUndefined(fromState);
        Preconditions.checkNotUndefined(op);
        return this._transferRelation.abstractSuccFor(fromState, op);
    }

    get abstractDomain(): AbstractDomain<ConcreteMemory, SymMemAbstractState> {
        return this._abstractDomain;
    }
}