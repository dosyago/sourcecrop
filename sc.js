#!/usr/bin/env node

/**

    sourcecrop - cat functions out of source code with autocomplete
    Copyright (C) 2024  Cris (@o0101) and Dosyago Corp.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

**/

import fs from 'fs';
import path from 'path';
import { spawnSync, execSync } from 'child_process';
import * as acorn from 'acorn';

const listed = new Set();
const uniqueNames = new Set();
const inverseIndex = {}; // Map callees to sets of callers

// Function to expand tilde (~) in file paths
const expandTilde = (filepath) => {
  if (filepath.startsWith('~')) {
    return path.join(process.env.HOME, filepath.slice(1));
  }
  return filepath;
};

// Ensure the correct number of arguments
if (process.argv.length < 3) {
  console.error('Usage: sc <file> [name|calls-<name>|by-<name>]');
  process.exit(1);
}

// Expand tilde in the provided file path
const filePath = path.resolve(expandTilde(process.argv[2]));
const name = process.argv[3] || null;

// Check if bat is installed
const isBatInstalled = () => {
  try {
    execSync('bat --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
};

const getAnonymousContext = (node) => {
  let name = `untitled-${node.start}`;
  if (node.parent) {
    if (node.parent.type === 'VariableDeclarator' && node.parent.id) {
      name = `${node.parent.id.name}`;
    } else if (node.parent.type === 'Property' && node.parent.key) {
      name = `${node.parent.key.name}`;
    } else if (node.parent.type === 'AssignmentExpression' && node.parent.left) {
      name = `${node.parent.left.name}`;
    } else if (node.parent.type === 'CallExpression' && node.parent.callee) {
      name = `${getCalleeName(node.parent)}`;
    } else if (node.parent?.parent?.type == 'CallExpression' && node.parent?.parent?.callee) {
      name = `${name}-in-${getCalleeName(node.parent.parent)}`;
    }
  }

  return name;
};

// Stack-based walker to add parent links
const addParentLinks = (ast) => {
  const stack = [];

  const visitNode = (node) => {
    if (stack.length > 0) {
      node.parent = stack[stack.length - 1];
    } else {
      node.parent = null;
    }

    stack.push(node);

    // Recursively visit child nodes
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object' && key !== 'parent') {
        visitNode(node[key]);
      }
    }

    stack.pop();
  };

  visitNode(ast);
};

// Helper function to get the callee name from a CallExpression node
const getCalleeName = (node) => {
  if (node.callee.type === 'Identifier') {
    return node.callee.name;
  } else if (node.callee.type === 'MemberExpression' && node.callee.object.type === 'Identifier') {
    return `${node.callee.object.name}.${node.callee.property.name}`;
  }
  return null;
};

// Function to add to the inverse index
const addToInverseIndex = (callee, caller) => {
  if (!callee || !caller) return;
  if (!inverseIndex[callee]) {
    inverseIndex[callee] = new Set();
  }
  inverseIndex[callee].add(caller);
};

// Function to list all items (functions, classes, imports, variables, etc.) and build the inverse index
const listItems = (ast, fileName) => {
  const items = [];
  const stack = [];  // Stack to track our current path in the AST

  const pushItem = item => {
    const key = `${fileName}:${item.start}:${item.end}`;
    if (!listed.has(key)) {
      items.push(item);
      listed.add(key);
    }
  };

  const visitNode = (node) => {
    stack.push(node);

    // Handle different types of nodes
    switch (node.type) {
      case 'FunctionDeclaration':
        if (node.id) {
          pushItem({ name: node.id.name, type: 'FunctionDeclaration', start: node.start, end: node.end });
        }
        break;
      case 'VariableDeclarator':
        if (node.init && node.init.type === 'ArrowFunctionExpression') {
          pushItem({ name: node.id.name, type: 'ArrowFunction', start: node.start, end: node.end });
        } else if (node.init && node.init.type === 'FunctionExpression') {
          pushItem({ name: node.id.name, type: 'FunctionExpression', start: node.start, end: node.end });
        }
        break;
      case 'MethodDefinition':
        if (node.key && node.key.name) {
          pushItem({ name: node.key.name, type: 'MethodDefinition', start: node.start, end: node.end });
        }
        break;
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        // Handle anonymous functions
        if (!node.id) {
          const context = getAnonymousContext(node);
          pushItem({ name: context, type: 'AnonymousFunction', start: node.start, end: node.end });
        }
        break;
      case 'CallExpression':
        const calleeName = getCalleeName(node);
        let callerName = null;

        // Traverse the stack to find the closest function/method context
        for (let i = stack.length - 1; i >= 0; i--) {
          const currentNode = stack[i];
          if (
            currentNode.type === 'FunctionDeclaration' ||
            currentNode.type === 'FunctionExpression' ||
            currentNode.type === 'ArrowFunctionExpression' ||
            currentNode.type === 'MethodDefinition'
          ) {
            callerName = currentNode.id ? currentNode.id.name : getAnonymousContext(currentNode);
            break;
          }
        }
        addToInverseIndex(calleeName, callerName);
        break;
    }

    // Recursively visit child nodes
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object' && key !== 'parent') {
        visitNode(node[key]);
      }
    }

    stack.pop();
  };

  visitNode(ast);
  return items;
};

// Function to list all functions called in the file
const listCallees = (ast) => {
  const callees = new Set();

  const visitNode = (node) => {
    if (node.type === 'CallExpression') {
      const calleeName = getCalleeName(node);
      if (calleeName) {
        callees.add(calleeName);
      }
    }

    // Recursively visit child nodes
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object' && key !== 'parent') {
        visitNode(node[key]);
      }
    }
  };

  visitNode(ast);
  return Array.from(callees);
};

// Function to list all functions that call other functions (for by- selector)
const listCallers = (ast) => {
  const callers = new Set();

  for (const callee in inverseIndex) {
    inverseIndex[callee].forEach(caller => callers.add(caller));
  }

  return Array.from(callers);
};

// Function to display the matched function's code
const displayFunctionCode = (data, matchedItems, batInstalled) => {
  console.log('');
  matchedItems.forEach((item) => {
    const snippet = normalizeIndent(data.slice(item.start, item.end));
    if (batInstalled) {
      const bat = spawnSync('bat', ['--theme=TwoDark', '--style=plain', '--color=always', '--language=javascript'], {
        input: snippet,
        encoding: 'utf8',
      });
      console.log(bat.stdout);
    } else {
      console.log(snippet);
    }
  });
  console.log('');
};

// Function to display a single function's code by name without using `walk.simple`
const displaySingleFunctionCode = (ast, functionName, data, batInstalled) => {
  let found = false;
  const stack = [];

  const visitNode = (node) => {
    stack.push(node);

    switch (node.type) {
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        const nodeName = node.id ? node.id.name : getAnonymousContext(node);
        if (nodeName === functionName) {
          found = true;
          displayFunctionCode(data, [{ start: node.start, end: node.end }], batInstalled);
        }
        break;
      case 'MethodDefinition':
        if (node.key && node.key.name === functionName) {
          found = true;
          displayFunctionCode(data, [{ start: node.start, end: node.end }], batInstalled);
        }
        break;
    }

    // Recursively visit child nodes
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object' && key !== 'parent') {
        visitNode(node[key]);
      }
    }

    stack.pop();
  };

  visitNode(ast);

  if (!found) {
    console.error(`Function '${functionName}' not found in the provided file.`);
  }
};

// Read and parse the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file ${filePath}:`, err);
    process.exit(1);
  }

  try {
    const ast = acorn.parse(data, { ecmaVersion: 'latest', sourceType: 'module' });

    // Add parent links using the stack-based walker
    addParentLinks(ast);

    // List items and build the inverse index
    const items = listItems(ast, filePath);

    const batInstalled = isBatInstalled();

    if (name) {
      if (name === '-listCallees') {
        const callees = listCallees(ast);
        callees.forEach(callee => console.log(callee));
        process.exit(0);
      } else if (name === '-listCallers') {
        const callers = listCallers(ast);
        callers.forEach(caller => console.log(caller));
        process.exit(0);
      } else if (name.startsWith('calls-')) {
        const calleeName = name.slice(6);
        const callers = inverseIndex[calleeName] || new Set();
        if (callers.size > 0) {
          if (process.argv.length >= 5) {
            const selectedCaller = process.argv[4];
            if (callers.has(selectedCaller)) {
              displaySingleFunctionCode(ast, selectedCaller, data, batInstalled);
              process.exit(0);
            }
          }
          console.log(`Functions that call '${calleeName}':`);
          callers.forEach(caller => console.log(caller));
        } else {
          console.error(`No functions call '${calleeName}' in the provided file.`);
        }
      } else if (name.startsWith('by-')) {
        const callerName = name.slice(3);
        const callees = [];
        for (const callee in inverseIndex) {
          if (inverseIndex[callee].has(callerName)) {
            callees.push(callee);
          }
        }
        if (callees.length > 0) {
          if (process.argv.length >= 5) {
            const selectedCallee = process.argv[4];
            if (callees.includes(selectedCallee)) {
              displaySingleFunctionCode(ast, selectedCallee, data, batInstalled);
              process.exit(0);
            }
          }
          console.log(`Functions called by '${callerName}':`);
          callees.forEach(callee => console.log(callee));
        } else {
          console.error(`No functions are called by '${callerName}' in the provided file.`);
        }
      } else {
        // Handle exact match for declared functions
        const matchedItems = items.filter(item => item.name === name);
        if (matchedItems.length) {
          displayFunctionCode(data, matchedItems, batInstalled);
        } else {
          console.error(`Element ${name} not found in file ${filePath}`);
        }
      }
      process.exit(0);
    } else {
      // List all declared functions for autocompletion
      items.forEach(item => console.log(item.name));
      process.exit(0);
    }
  } catch (parseError) {
    console.error('Error parsing JavaScript file:', parseError);
    process.exit(1);
  }
});

function normalizeIndent(code) {
  // Split the code into lines
  const lines = code.split('\n');

  let first = '';
  if (!lines[0].match(/^\s+/)) first = lines.shift();

  // skip first line if it doesn't start with indent

  // Find the minimum indent (ignoring empty lines)
  const minIndent = lines.reduce((min, line) => {
    const trimmed = line.trimStart();
    if (trimmed.length === 0) return min; // Skip empty lines
    const indent = line.length - trimmed.length;
    return Math.min(min, indent);
  }, Infinity);

  // Normalize all lines by removing the minimum indent
  return first + '\n' + lines.map(line => line.slice(minIndent)).join('\n');
}

