'use strict';

module.exports = function(mod, generate){
	generate.types.nav_builder = generate.mongooseTypes.Mixed;
	return generate(mod);
};
