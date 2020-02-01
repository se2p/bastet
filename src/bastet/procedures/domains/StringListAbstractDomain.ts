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

import {AbstractDomain, AbstractionPrecision} from "./AbstractDomain";
import {ConcreteDomain, ConcreteList, ConcreteString, ConcreteStringList} from "./ConcreteElements";
import {AbstractElement, Lattice} from "../../lattices/Lattice";
import {ImplementMeException} from "../../core/exceptions/ImplementMeException";

export interface AbstractStringList extends AbstractElement {

}

export class StringListLattice implements Lattice<AbstractStringList> {

    bottom(): AbstractStringList {
        throw new ImplementMeException();
    }

    isIncluded(element1: AbstractStringList, element2: AbstractStringList): boolean {
        throw new ImplementMeException();
    }

    join(element1: AbstractStringList, element2: AbstractStringList): AbstractStringList {
        throw new ImplementMeException();
    }

    meet(element1: AbstractStringList, element2: AbstractStringList): AbstractStringList {
        throw new ImplementMeException();
    }

    top(): AbstractStringList {
        throw new ImplementMeException();
    }

}

export class StringListAbstractDomain implements AbstractDomain<ConcreteStringList, AbstractStringList> {

    concreteDomain: ConcreteDomain<ConcreteStringList>;
    lattice: Lattice<AbstractStringList>;

    abstract(elements: Iterable<ConcreteStringList>): AbstractStringList {
        throw new ImplementMeException();
    }

    concretize(element: AbstractStringList): Iterable<ConcreteStringList> {
        throw new ImplementMeException();
    }

    widen(element: AbstractStringList, precision: AbstractionPrecision): AbstractStringList {
        throw new ImplementMeException();
    }

}