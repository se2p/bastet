/*
 *   BASTET Program Analysis Framework
 *
 *   Copyright 2019 by University of Passau
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

import {ScratchType, VoidType} from "../../ast/core/ScratchType";
import {RuleNode} from "antlr4ts/tree";

export type DataLocationID = string;

export type DataLocationMap = { [id:string]: DataLocation } ;

export default class DataLocation {

    constructor(stmt: RuleNode|null, id: string, type: ScratchType) {

    }

    private static readonly VOID_LOCATION = new DataLocation(null, "void", VoidType.instance());

    static void(): DataLocation {
        return this.VOID_LOCATION;
    }

}
