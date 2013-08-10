# simple-calculator.js

It's a simple calculator, in case you couldn't tell. It supports arbitrary evaluation of mathematical expressions while checking for operator precedence. Supported operations include braces, unary negation, exponentiation, multiplication, and addition.

## Usage
```javascript
  var calc = require('simple-calculator');
  calc('(5 + 5) / 24^-8');
  calc(' (5 + 5 / 24)^-8', true); // Verbose reporting.
```
The first argument is a string expression, the second is `true` or `false` for verbosity, the third is the number of decimal places to round (defaults to 5).
