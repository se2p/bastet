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


import {Refiner} from "../Refiner";
import {AbstractState, Lattices, LatticeWithComplements} from "../../../lattices/Lattice";
import {FrontierSet, ReachedSet} from "../../algorithms/StateSet";
import {IllegalStateException} from "../../../core/exceptions/IllegalStateException";
import {ValueAbstractState} from "./ValueAbstractDomain";
import { Preconditions } from "../../../utils/Preconditions";
import {AccessibilityRelation} from "../Accessibility";
import {ValueAbstractStates} from "./ValueAbstractStates";
import {getTheOnlyElement} from "../../../utils/Collections";

export class ValueRefiner implements Refiner<AbstractState> {

    private readonly _lattice: LatticeWithComplements<ValueAbstractState>;

    constructor(lattice: LatticeWithComplements<ValueAbstractState>) {
        this._lattice = lattice;
    }

    checkIsFeasible(reached: ReachedSet<AbstractState>, ar: AccessibilityRelation<AbstractState>, fullState: AbstractState, purpose: string = null): boolean {
        Preconditions.checkNotUndefined(reached);
        Preconditions.checkNotUndefined(fullState);

        const dataState: ValueAbstractState = getTheOnlyElement(ValueAbstractStates.extractFrom(fullState));
        return Lattices.isFeasible(dataState, this._lattice, purpose);
    }

    refinePrecision(frontier: FrontierSet<AbstractState>, reached: ReachedSet<AbstractState>, ar: AccessibilityRelation<AbstractState>, infeasibleState: ValueAbstractState): [FrontierSet<AbstractState>, ReachedSet<AbstractState>] {
        throw new IllegalStateException("This refiner does not support precision refinement!");
    }

}
