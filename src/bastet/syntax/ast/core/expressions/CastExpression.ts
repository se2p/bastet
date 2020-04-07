/*
 *   BASTET Program Analysis and Verification Framework
 *
 *   Copyright 2019 by University of Passau (uni-passau.de)
 *
 *   Maintained by Andreas Stahlbauer (firstname@lastname.net),
 *   see the file CONTRIBUTORS.md for the list of contributors.
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


import {Expression} from "./Expression";
import {AbstractExpression} from "./AbstractExpression";
import {ScratchType} from "../ScratchType";
import {Preconditions} from "../../../../utils/Preconditions";

export class CastExpression extends AbstractExpression implements Expression {

    private _toConvertFrom: Expression;

    constructor(inputExpression: Expression, castToType: ScratchType) {
        super(castToType, [inputExpression, castToType]);
        this._toConvertFrom = Preconditions.checkNotUndefined(inputExpression);
    }

    get castToType(): ScratchType {
       return this.expressionType;
    }

    get toConvertFrom(): Expression {
        return this._toConvertFrom;
    }
}
