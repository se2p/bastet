/*
 *   BASTET Program Analysis Framework
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

export class ImmutableSet<E> implements ReadonlySet<E> {

    private readonly _elements: Set<E>;

    constructor(elements: Iterable<E>) {
        this._elements = new Set(elements);
    }

    public get size() {
        return this._elements.size;
    }

    public [Symbol.iterator](): IterableIterator<E> {
        return this._elements[Symbol.iterator]();
    }

    public entries(): IterableIterator<[E, E]> {
        return this._elements.entries();
    }

    public forEach(callbackfn: (value: E, value2: E, set: Set<E>) => void, thisArg?: any): void {
        return this._elements.forEach(callbackfn, thisArg);
    }

    public has(value: E): boolean {
        return this._elements.has(value);
    }

    public keys(): IterableIterator<E> {
        return this._elements.keys();
    }

    public values(): IterableIterator<E> {
        return this._elements.values();
    }

    static copyOf<E>(entries: Set<E>) {
        return new ImmutableSet(entries);
    }

}
