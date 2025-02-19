// Import and export
import path from 'path'
export const exportedConst = 42;

// Variables
const num = 10, str = 'hello', arr = [1, 2, 3], obj = { key: 'value' };

// Functions
function func(a, b = 5) {
  return a + b;
}

// Arrow Function
const arrowFunc = (x) => x * 2;

// Classes
class MyClass extends BaseClass {
  #privateField = 'secret';
  constructor(name) {
    super(name);
    this.name = name;
  }
  get nameUpper() {
    return this.name.toUpperCase();
  }
  static staticMethod() {
    return 'static';
  }
}

// Template Literals
const greeting = `Hello, ${str}!`;

// Destructuring
const [first, , third] = arr;
const { key } = obj;

// Spread and Rest
const newArr = [...arr, 4];
const newObj = { ...obj, newKey: 'newValue' };
const sum = (...args) => args.reduce((acc, val) => acc + val, 0);

// Promises and Async/Await
async function asyncFunc() {
  const data = await fetchData();
  return data;
}
const promise = new Promise((resolve, reject) => {
  resolve('done');
});

// Conditional Statements
const isEven = num % 2 === 0 ? 'even' : 'odd';

// Loops
for (let i = 0; i < arr.length; i++) {
  console.log(arr[i]);
}
for (const key in obj) {
  console.log(key);
}
for (const value of arr) {
  console.log(value);
}
arr.forEach((item) => console.log(item));

// Modules - dynamic import
import('./dynamicModule.js').then(module => {
  module.dynamicFunc();
});

// Try/Catch
try {
  throw new Error('An error occurred');
} catch (error) {
  console.error(error);
} finally {
  console.log('Cleanup');
}

// Symbols
const sym = Symbol('unique');

// Maps and Sets
const map = new Map();
map.set('key', 'value');
const set = new Set([1, 2, 3]);

// WeakMap and WeakSet
const weakMap = new WeakMap();
const weakSet = new WeakSet();

// Optional Chaining and Nullish Coalescing
const nestedObj = { a: { b: { c: 5 } } };
const value = nestedObj?.a?.b?.c ?? 'default';

// BigInt
const bigInt = 9007199254740991n;

// Regular Expressions
const regex = /hello/gi;

// Tagged Template Literals
const tag = (strings, ...values) => `${strings[0]}${values.join(', ')}`;
const result = tag`Sum: ${sum(1, 2, 3)}`;

// Generators
function* generatorFunc() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = generatorFunc();
for (const val of gen) {
  console.log(val);
}

// Proxy
const handler = {
  get: (target, prop) => prop in target ? target[prop] : 'default'
};
const proxy = new Proxy(obj, handler);
console.log(proxy.key, proxy.nonExistentKey);

// Reflect
const reflectValue = Reflect.get(obj, 'key');

// Iterators
const iterator = arr[Symbol.iterator]();
console.log(iterator.next().value);

// Internationalization (Intl)
const number = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(123456.789);

// Import Meta
console.log(import.meta.url);

// Modules - re-export
export * from 'fs';

