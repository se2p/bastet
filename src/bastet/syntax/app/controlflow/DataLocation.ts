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

import {ScratchType, ScratchTypeID, VoidType} from "../../ast/core/ScratchType";
import {Record as ImmRec} from "immutable";
import {Identifier} from "../../ast/core/Identifier";
import {Preconditions} from "../../../utils/Preconditions";

export type DataLocationID = string;

export type DataLocationMap = { [id:string]: TypedDataLocation } ;

export const VAR_SCOPING_SPLITTER = "@";

export interface DataLocation {

    type: ScratchTypeID;

    ident: string;

    qualifiedName: string;

}

export interface TypedDataLocationAttributes {

    type: ScratchTypeID;

    ident: string;

    qualifiedName: string;

}

export interface StaticDataLocationAttributes extends TypedDataLocationAttributes {

    version: number;

}

const TypedDataLocationRecord = ImmRec({

    type: 0,

    ident: "",

    qualifiedName: ""

});

const VersionedDataLocationRecord = ImmRec({

    type: 0,

    ident: "",

    qualifiedName: "",

    version: 0

});

export class TypedDataLocation extends TypedDataLocationRecord implements TypedDataLocationAttributes {

    constructor(ident: string, type: ScratchTypeID) {
        super({ident: ident, qualifiedName: ident, type: type});
    }

    public getIdent(): string {
        return this.get("ident");
    }

    public getQualifiedName(): string {
        return this.get("qualifiedName");
    }

    public getType(): ScratchTypeID {
        return this.get("type");
    }

    private static VOID_LOCATION;

    static void(): DataLocation {
        if (!TypedDataLocation.VOID_LOCATION) {
            TypedDataLocation.VOID_LOCATION = new TypedDataLocation("void", VoidType.instance().typeId);
        }
        return this.VOID_LOCATION;
    }

}

export class VersionedDataLocation extends VersionedDataLocationRecord implements StaticDataLocationAttributes {

    constructor(ident: string, type: ScratchTypeID, version: number) {
        const qualifiedName = `${ident}${VAR_SCOPING_SPLITTER}${version}`
        super({ident: ident, qualifiedName: qualifiedName, type: type, version: version});
    }

    public getIdent(): string {
        return this.get("ident");
    }

    public getType(): ScratchTypeID {
        return this.get("type");
    }

    public getVersion(): number {
        return this.get("version");
    }

    public getQualifiedName(): string {
        return this.get("qualifiedName");
    }

}

/**
 * Might add actor-specific prefixes.
 */
export interface DataLocationMapper {

    mapDataLocation(loc: DataLocation): DataLocation;

}

export class DummyDataLocationMapper implements DataLocationMapper {

    mapDataLocation(loc: DataLocation): DataLocation {
        return loc;
    }

}

export class DataLocations {

    public static createTypedLocation(id: Identifier, type: ScratchType) {
        Preconditions.checkNotUndefined(id);
        Preconditions.checkNotUndefined(type);
        return new TypedDataLocation(id.text, type.typeId);
    }

}
