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

import {WithIdent} from "../../utils/WithIdent";
import {IllegalArgumentException} from "../../core/exceptions/IllegalArgumentException";
import {ImageResourceType, ResourceType, SoundResourceType} from "../ast/core/ResourceDefinition";

export type AppResourceMap = { [id:string]: AppResource } ;

export enum AppResourceType {
    IMAGE = "image",
    SOUND = "sound"
}

export class AppResource implements WithIdent {

    private readonly _ident : string;
    private readonly _type : ResourceType;
    private readonly _uri : string;

    constructor(ident: string, type: ResourceType, uri: string) {
        this._ident = ident;
        this._type = type;
        this._uri = uri;
    }

    get ident(): string {
        return this._ident;
    }

    get type(): ResourceType {
        return this._type;
    }

    get uri(): string {
        return this._uri;
    }

    public static typeFromString(text: string): ResourceType {
        switch(text) {
            case "image":
                return ImageResourceType.instance();
            case "sound":
                return SoundResourceType.instance();
            default:
                throw new IllegalArgumentException("Unsupported type of resource");
        }
    }
}
