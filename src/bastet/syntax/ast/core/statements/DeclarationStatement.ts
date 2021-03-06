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

import {Statement} from "./Statement";
import {Identifier} from "../Identifier";
import {ScratchType} from "../ScratchType";
import {StringExpression} from "../expressions/StringExpression";
import {VariableWithDataLocation} from "../Variable";
import {Preconditions} from "../../../../utils/Preconditions";
import {AstNode} from "../../AstNode";

export abstract class DeclarationStatement extends Statement {

    constructor(childs: AstNode[]) {
        super(childs);
    }

}

export interface VariableDeclaration {

    identifier: Identifier;
    variableType: ScratchType;

}

export abstract class DeclareVariableStatement extends DeclarationStatement implements VariableDeclaration {

    private readonly _variable: VariableWithDataLocation;

    constructor(variable: VariableWithDataLocation) {
        Preconditions.checkNotUndefined(variable);
        super([variable, variable.variableType]); // Important: Also add the type. To prevent caching problems.
        this._variable = variable;
    }

    get identifier(): Identifier {
        return this._variable.identifier;
    }

    get variableType(): ScratchType {
        return this._variable.variableType;
    }

    get variable(): VariableWithDataLocation {
        return this._variable;
    }
}

export class DeclareStackVariableStatement extends DeclareVariableStatement {

    constructor(variable: VariableWithDataLocation) {
        Preconditions.checkNotUndefined(variable);
        super(variable);
    }

}

export class DeclareActorVariableStatement extends DeclareVariableStatement {

    constructor(variable: VariableWithDataLocation) {
        Preconditions.checkNotUndefined(variable);
        super(variable);
    }

}

export class DeclareSystemVariableStatement extends DeclareVariableStatement {

    constructor(variable: VariableWithDataLocation) {
        Preconditions.checkNotUndefined(variable);
        super(variable);
    }

}

export class DeclareAttributeStatement extends DeclarationStatement {

    private readonly _attribute: StringExpression;
    private readonly _attributeType: ScratchType;

    constructor(attribute: StringExpression, type: ScratchType) {
        super([attribute, type]);
        this._attribute = attribute;
        this._attributeType = type;
    }

    get attributeType(): ScratchType {
        return this._attributeType;
    }

    get attribute(): StringExpression {
        return this._attribute;
    }

}

