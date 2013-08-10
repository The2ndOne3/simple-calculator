/**
 * A simple expression evaluator.
 */
;(function(){
  /**
   * Tokens object.
   * Key is a unique identifier. Value is matching regex, with 0th capture group as the token value.
   */
  var tokens = {
    'NUMBER':/([0-9\.]+)/,
    'OPENPARENS':/(\()/,
    'CLOSEPARENS':/(\))/,
    'EXPONENT':/(\^)/,
    'MULTIPLY':/(\*)/,
    'DIVIDE':/(\/)/,
    'ADD':/(\+)/,
    'SUBTRACT':/(\-)/,
  };
  /**
   * Lexical analyser.
   * Takes string of valid expressions; does not check for malformation.
   * Outputs array of tokens in order.
   */
  var lexer = function(string){
    var output = []
      , working = string;

    while(working.length > 0){
      for(var type in tokens){
        var look = tokens[type].exec(working); // Execute token's regex.

        if(look === null){
          continue;
        }
        else if(look.index === 0){
          var value = look[1]; // Pull from regex capture.
          if(type == 'NUMBER'){
            value = Number(value); // Cast numbers to numeric datatypes.
          }

          output.push({
            type: type,
            value: value
          });

          working = working.substr(look[1].length); // Consume all.
        }
      }
    }

    return output;
  };

  /**
   * Traverses the binary tree in reverse-level-order.
   * Takes a binary node tree of form {left: node || NUM_TOKEN , right: node || NUM_TOKEN , op: OP_TOKEN}
   * such that leaves are of form {type: TOKEN_NAME, value: string}
   * NOTE: this evaluation is done in-place, and modifies the tree.
   */
  var traverse = function(target){
    /**
     * Define operations.
     * Takes arguments operand1, operand2 of type number || string
     * and argument operator of type OP_TOKEN_NAME || string.
     */
    var operate = function(operand1, operand2, operator){
      operand1 = Number(operand1), operand2 = Number(operand2);
      switch(operator){
        case 'SUBTRACT': case '-': operand2 = -1 * operand2;
        case 'ADD': case '+': return operand1 + operand2;

        case 'DIVIDE': case '/': operand2 = 1 / operand2;
        case 'MULTIPLY': case '*': return operand1 * operand2;

        case 'EXPONENT': case '^': return Math.pow(operand1, operand2);
      }
      throw new Error('Invalid operator.');
    };

    // Traverse in reverse-level-order; highest priority operations are deepest.
    var stack = []
      , queue = [];

    queue.push(target);

    while(queue.length > 0){
      var n = queue[0];

      if(n.right.type != 'NUMBER'){
        queue.push(n.right);
      }
      if(n.left.type != 'NUMBER'){
        queue.push(n.left);
      }
      stack.push(queue.shift());
    }

    while(stack.length > 0){
      var n2 = stack.pop()
        , right
        , left;

      if(n2.right.type != 'NUMBER'){
        right = n2.right.result;
      }
      else{
        right = n2.right.value;
      }
      if(n2.left.type != 'NUMBER'){
        left = n2.left.result;
      }
      else{
        left = n2.left.value;
      }

      n2.result = operate(left, right, n2.op.value);
    }

    return target.result;
  };

  // Parsers.
  var parsers = {
    /**
     * Recursively process tokens.
     * Takes array of tokens.
     * Returns binary syntax tree.
     */
    parse: function(tokens){
      tokens = parsers.additive(tokens);
      tokens = parsers.multiplicative(tokens);
      tokens = parsers.exponential(tokens);
      return tokens;
    },
    exponential: function(tokens){
      return parsers.binary_operation(tokens, ['EXPONENT']);
    },
    multiplicative: function(tokens){
      return parsers.binary_operation(tokens, ['MULTIPLY', 'DIVIDE']);
    },
    additive: function(tokens){
      return parsers.binary_operation(tokens, ['ADD', 'SUBTRACT']);
    },
    /**
     * Recursively parse binary operations of certain token operator names.
     * Takes an array of tokens.
     * Returns nodes of particular operator.
     */
    binary_operation: function(tokens, types){
      var node = {
        left: null,
        op: null,
        right: null
      };

      if(tokens.length == 1){ // Edge case: single embedded expression.
        if(tokens[0].type == 'NUMBER'){
          return tokens[0];
        }
        else if(tokens[0].length > 1){
          return parsers.parse(tokens[0]);
        }
      }

      for(var i = 0; i < tokens.length; i++){
        for(var j = 0; j < types.length; j++){
          if(tokens[i].type == types[j]){
            node.op = tokens[i];
            node.left = parsers.parse(tokens.slice(0, i));
            node.right = parsers.parse(tokens.slice(i + 1));
          }
        }
      }

      if(node.op === null){
        return tokens;
      }
      return node;
    },
    /**
     * These functions do not need to be recalled recursively; they require only one pass.
     * Takes array of tokens.
     * Returns tokens after preprocess pass.
     */
    preprocess: function(tokens){
      tokens = parsers.parens(tokens);
      tokens = parsers.unary_neg(tokens);
      return tokens;
    },
    /**
     * Parse parentheses.
     * Takes array of tokens.
     * Returns tokens with parenthetical nesting.
     */
    parens: function(tokens){
      var new_tokens = null;

      for(var i = 0; i < tokens.length; i++){
        if(tokens[i].type == 'OPENPARENS'){
          var nesting = false, nest = 1; // Handle parentheses nesting.
          for(var j = i + 1; j < tokens.length; j++){
            if(tokens[j].type == 'OPENPARENS'){
              if(!nesting){
                nesting = true;
              }
              nest++;
            }
            if(tokens[j].type == 'CLOSEPARENS'){
              if(nesting){
                nest--;
              }
              if(!nesting || (nesting && nest === 0)){
                break;
              }
            }
          }

          new_tokens = tokens.slice(0, i);

          var recursive_tokens = parsers.parens(tokens.slice(i + 1, j));
          if(recursive_tokens.length < 3){ // Less than a complete statement is possible; avoid double-embedding unary negatives and numbers.
            new_tokens = new_tokens.concat(recursive_tokens);
          }
          else{
            new_tokens.push(recursive_tokens);
          }

          new_tokens = new_tokens.concat(parsers.parens(tokens.slice(j + 1)));
          break;
        }
      }

      if(new_tokens === null){
        return tokens;
      }
      return new_tokens;
    },
    /**
     * Parse unary negation.
     * Takes array of tokens with parenthetical nesting.
     * Returns tokens with unary negation expanded to binary multiplication with precedence.
     */
    unary_neg: function(tokens){
      for(var i = 0; i < tokens.length; i++){
        if(tokens[i].type == 'SUBTRACT'){
          if(i === 0 || ( // Edge case: negation occurs at beginning of sequence.
            tokens[i - 1].type != 'NUMBER' &&
            Object.prototype.toString.call(tokens[i - 1]) != '[object Array]')){ // Subsequent token is not nested expression or number.
            tokens.splice(i, 2, [
              {
                type: 'NUMBER',
                value: -1
              },
              {
                type: 'MULTIPLY',
                value: '*'
              },
              tokens[i + 1]
            ]);
          }
        }
        if(Object.prototype.toString.call(tokens[i]) == '[object Array]'){ // Recurse.
          tokens[i] = parsers.unary_neg(tokens[i]);
        }
      }

      return tokens;
    }
  };

  // Exports.
  var evaluate = function(expression, verbose, decimal_places){
    // Default arguments.
    verbose = verbose || false;
    decimal_places = decimal_places || 5;

    // Strip whitespace.
    expression = expression.replace(/\s/g, '');

    // Lexical analysis.
    var lexed = lexer(expression);

    // Parsing.
    var preprocessed = parsers.preprocess(lexed);
    var parsed = parsers.parse(preprocessed);

    // Verbose reporting.
    if(verbose){
      var util = require('util');

      console.log('Input: ', expression);
      console.log('Lexing: ');
      console.log(util.inspect(lexed, {
        depth: null,
        colors: true
      }));
      console.log('Parenthetical Structure: ');
      console.log(util.inspect(preprocessed, {
        depth: null,
        colors: true
      }));
      console.log('Expression tree: ');
      console.log(util.inspect(parsed, {
        depth: null,
        colors: true
      }));
      console.log('Answer: ', answer);
    }

    // Evaluate tree and format answer to correct decimal places.
    var answer = traverse(parsed).toFixed(decimal_places);
    for(var i = answer.length - 1; i > answer.indexOf('.'); i--){
      if(answer[i] != '0'){
        break;
      }
    }
    if(i == answer.length - (decimal_places + 1)){
      i--;
    }
    answer = answer.substr(0, i + 1);

    // Cast answer back into number.
    return Number(answer);
  };

  module.exports = evaluate;
})();