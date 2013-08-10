var calculate = require(__dirname + '/../src/simple-calculator')
  , should = require('chai').should();

describe('Calculator', function(){
  it('should handle whitespace', function(){
    calculate('2+2         ').should.equal(4);
  });
  it('should handle simple calculations', function(){
    calculate('234*75').should.equal(17550);
    calculate('34/4').should.equal(8.5);
    calculate('12/2').should.equal(6);
    calculate('3.48234621 - 9.3457215127').should.equal(-5.86338);
    calculate('3.482 * 9.34').should.equal(32.52188);
  });
  it('should determine operator precedence', function(){
    calculate('3.48234621*2 - 9.3457215127/1').should.equal(-2.38103);
    calculate('8.654^4*3').should.equal(16826.30738);
    calculate('241 * 14.3').should.equal(3446.3);
    calculate('4^6 / 147').should.equal(27.86395);
    calculate('4 / 147^-1').should.equal(588);
  });
  it('should handle parenthetical expressions', function(){
    calculate('(59 - 15 + 3*7)/21').should.equal(3.09524);
    calculate('-(0.048-0.047)^-1').should.equal(-1000);
  });
  it('should handle unary parenthetical expressions', function(){
    calculate('-(48)+2').should.equal(-46);
    calculate('(35-(43.568*34-23456)*3/(8312))+(-21)').should.equal(21.93119);
    calculate('(((12-43.2) + 823.592)*(23.34/2))-2^1').should.equal(9245.21464);
    calculate('(((12-43.2) + 823.592)*(23.34/2))-2^-2 ').should.equal(9246.96464);
  });
});