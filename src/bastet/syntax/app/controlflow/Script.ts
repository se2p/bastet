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

import {TransitionRelation, TransitionRelations, WithTransitionRelation} from "./TransitionRelation";
import {CoreEvent} from "../../ast/core/CoreEvent";
import {Preconditions} from "../../../utils/Preconditions";
import {LocationId} from "./ControlLocation";
import {Identifier} from "../../ast/core/Identifier";


export type ScriptId = string;

/**
 * A single script, which represents the control flow
 * of a program or a fraction of a program.
 */
export class Script implements WithTransitionRelation {

    /** A unique identifier of this script */
    private readonly _id: Identifier;

    /** This script is triggered by the following event */
    private readonly _event: CoreEvent;

    /** The transition relation of the script */
    private readonly _transitions: TransitionRelation;

    /** Restart the script in case the event is triggered? */
    private readonly _restartOnTriggered: boolean;

    constructor(id: Identifier, event: CoreEvent, restart: boolean, transitions: TransitionRelation) {
        Preconditions.checkNotUndefined(event);
        Preconditions.checkNotUndefined(transitions);
        this._id = id;
        this._event = event;
        this._restartOnTriggered = restart;
        this._transitions = TransitionRelations.named(transitions, id.text);
    }

    get transitions(): TransitionRelation {
        return this._transitions;
    }

    get event(): CoreEvent {
        return this._event;
    }

    get id(): string {
        return this._id.text;
    }

    get restartOnTriggered(): boolean {
        return this._restartOnTriggered;
    }

    public getInitialLocation(): LocationId {
        Preconditions.checkState(this.transitions.entryLocationSet.size === 1);
        return this.transitions.entryLocationSet.values().next().value;
    }

}
