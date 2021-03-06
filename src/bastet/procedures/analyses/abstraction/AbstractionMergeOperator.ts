/*
 *   BASTET Program Analysis and Verification Framework
 *
 *   Copyright 2020 by University of PaAbstractionu (uni-paAbstractionu.de)
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

import {MergeOperator} from "../ProgramAnalysis";
import {AbstractState} from "../../../lattices/Lattice";
import {Preconditions} from "../../../utils/Preconditions";
import {App} from "../../../syntax/app/App";
import {AbstractionState, AbstractionStateLattice} from "./AbstractionAbstractDomain";

export class AbstractionMergeOperator implements MergeOperator<AbstractionState> {

    private readonly _task: App;

    private readonly _wrappedMergeOp: MergeOperator<AbstractState>;

    private readonly _lattice: AbstractionStateLattice;

    constructor(task: App, wrappedMergeOp: MergeOperator<AbstractState>, lattice: AbstractionStateLattice) {
        this._task = Preconditions.checkNotUndefined(task);
        this._wrappedMergeOp = Preconditions.checkNotUndefined(wrappedMergeOp);
        this._lattice = Preconditions.checkNotUndefined(lattice);
    }

    merge(state1: AbstractionState, state2: AbstractionState): AbstractionState {
        const wrappedMerged = this._wrappedMergeOp.merge(state1.getWrappedState(), state2.getWrappedState());
        return state1
            .withEnteringSummary(this._lattice.folLattice.join(state1.enteringSummary, state2.enteringSummary))
            .withWrappedState(wrappedMerged);
    }

    shouldMerge(state1: AbstractionState, state2: AbstractionState): boolean {
        if (state1.blockId != state2.blockId) {
            return false;
        }

        if (!state1.getPrecision().equals(state2.getPrecision())) {
            return false;
        }

        if (!this._wrappedMergeOp.shouldMerge(state1, state2)) {
            return false;
        }

        return state1.getEnteringSummary().equals(state2.getEnteringSummary());
    }

}
