const TYPES = {
    STRING: 0,
    NUMBER: 1,
    BOOLEAN: 2,
    NULL: 3
};

/**
 * Given a value, determine it's type.
 * 
 * Given a string value and type, coerce to that type
 * 
 * @param {mixed}  val    
 * @param {string} type
 * 
 * @return {number} 
 */
module.exports = function coerce(val, type) {
   if (type === undefined) {
       switch(typeof val) {
           case "string":
               return TYPES.STRING;
               break;
           case "number":
               return TYPES.NUMBER;
               break;
           case "boolean":
               return TYPES.BOOLEAN;
               break;
           default:
               return TYPES.NULL;
       }
   } else {
       switch(parseInt(type)) {
           case TYPES.NUMBER:
               return parseFloat(val);
               break;
           case TYPES.BOOLEAN:
               return val === "true";
               break;
           case TYPES.NULL:
               return null
               break;
           default:
               return val;
       }
   }
};
