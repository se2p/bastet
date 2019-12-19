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

import {Expression} from "./Expression";
import {AbstractExpression} from "./AbstractExpression";
import {AstNode} from "../../AstNode";
import {BooleanType, NumberType} from "../ScratchType";
import {BinaryExpression} from "./BinaryExpression";
import {Identifier} from "../Identifier";
import {UnaryExpression} from "./UnaryExpression";
import {StringExpression} from "./StringExpression";
import {NumberExpression} from "./NumberExpression";
import {ImplementMeException} from "../../../../core/exceptions/ImplementMeException";

export interface BooleanExpression extends Expression {

}

export class AbstractBooleanExpression extends AbstractExpression implements BooleanExpression {

    constructor(childs: AstNode[]) {
        super(NumberType.instance(), childs);
    }

}

export class UnaryBoolExpression extends UnaryExpression<BooleanExpression> implements BooleanExpression {

    constructor(op1: BooleanExpression) {
        super(BooleanType.instance(), op1);
    }

}

export class BinaryBoolExpression extends BinaryExpression<BooleanExpression, BooleanExpression> implements BooleanExpression {

    constructor(op1: BooleanExpression, op2: BooleanExpression) {
        super(BooleanType.instance(), op1, op2);
    }

}

export class BooleanLiteral extends AbstractBooleanExpression {

    private readonly _literal: boolean;

    constructor(literal: boolean) {
        super([]);
        this._literal = literal;
    }

    public static fromString(text: string): BooleanLiteral {
        throw new ImplementMeException();
    }

    toTreeString(): string {
        if (this._literal) {
            return "true";
        } else {
            return "false";
        }
    }

}

export class BooleanVariableExpression extends AbstractBooleanExpression {

    private readonly _variable: Identifier;

    constructor(variable: Identifier) {
        super([variable]);
        this._variable = variable;
    }

}

export class NegationExpression extends AbstractBooleanExpression {

    private readonly _negate: BooleanExpression;

    constructor(negate: BooleanExpression) {
        super([negate]);
        this._negate = negate;
    }
}

export class AndExpression extends BinaryBoolExpression {

    constructor(op1: BooleanExpression, op2: BooleanExpression) {
        super(op1, op2);
    }
}

export class OrExpression extends BinaryBoolExpression {

    constructor(op1: BooleanExpression, op2: BooleanExpression) {
        super(op1, op2);
    }
}

export class StrGreaterThanExpression extends BinaryExpression<StringExpression, StringExpression> implements BooleanExpression {

    constructor(op1: StringExpression, op2: StringExpression) {
        super(BooleanType.instance(), op1, op2);
    }
}

export class StrLessThanExpression extends BinaryExpression<StringExpression, StringExpression> implements BooleanExpression {

    constructor(op1: StringExpression, op2: StringExpression) {
        super(BooleanType.instance(), op1, op2);
    }
}

export class StrEqualsExpression extends BinaryExpression<StringExpression, StringExpression> implements BooleanExpression {

    constructor(op1: StringExpression, op2: StringExpression) {
        super(BooleanType.instance(), op1, op2);
    }
}

export class NumGreaterThanExpression extends BinaryExpression<NumberExpression, NumberExpression> implements BooleanExpression {

    constructor(op1: NumberExpression, op2: NumberExpression) {
        super(BooleanType.instance(), op1, op2);
    }
}

export class NumLessThanExpression extends BinaryExpression<NumberExpression, NumberExpression> implements BooleanExpression {

    constructor(op1: NumberExpression, op2: NumberExpression) {
        super(BooleanType.instance(), op1, op2);
    }
}

export class NumEqualsExpression extends BinaryExpression<NumberExpression, NumberExpression> implements BooleanExpression {

    constructor(op1: NumberExpression, op2: NumberExpression) {
        super(BooleanType.instance(), op1, op2);
    }
}

export class StrContainsExpression extends BinaryExpression<StringExpression, StringExpression> implements BooleanExpression {

    constructor(op1: StringExpression, op2: StringExpression) {
        super(BooleanType.instance(), op1, op2);
    }
}