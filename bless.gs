//
// bless() @ http://coderofsalvation.github.io/bless 
// 
//         appscript note: call .data() to get the data without the functions (because gs lacks __proto__ mutations)  
//
function bless(o){
  var _ = {}
  
  _.unbless = function(obj){
    for( var i in _ ) delete obj[i]
    delete obj.events
    return obj
  }
  
  _.get = function get(obj,x,fallback) {
      obj = obj || this
      var o = String(x).split('.').reduce(function(acc, x) {
          if (acc == null || acc == undefined ){
              bless.set(obj,x,fallback)
              return fallback;
          }
          return new Function("x","acc","return acc['" + x.split(".").join("']['") +"']" )(x, acc) || fallback
      }, obj)
      return bless( o || {} )
  }
  
  _.set = function set(obj, path, value) {
    var last
    var o = obj || this
    path = String(path)
    var vars = path.split(".")
    var lastVar = vars[vars.length - 1]
    vars.map(function(v) {
        if (lastVar == v) return
        o = (new Function("o","return o." + v)(o) || new Function("o","return o."+v+" = {}")(o))
        last = v
    })
    new Function("o","v","o." + lastVar + " = v")(o, value)
    return bless( obj || {} )
  }
  
  _.each = function(obj,f){
    for( var i in obj ){ 
      if( typeof obj[i] != 'function' ) f( obj[i], i )
    }
    return bless( obj || {} )
  }
  
  _.toArray = function(o){
    if( o.push ) return o // already array
    var y = []
    for( var i in o ) y.push({key:i,value:o})
    return bless(y)
  }
  
  _.clone  = function(a){
    return bless( JSON.parse( JSON.stringify(a || this) ) )
  }
  
  _.data = function(o){
    return bless(o).clone().unbless() // return clone without blessed functions
  }
  
  _.eventemitter = function(o){
    o.events = {}
    o.emit = function(e,val){
      var evs = o.get('events.'+e)
      evs.map( function(f){ f(val) } )
      return o
    }
    o.on = function(e,f){
      var evs  = o.get('events.'+e,[])
      evs.push(f)
      o.set('events.'+e,evs)
      return o
    }
  }
  
  _.mixin = function(o,fn,f){
    o[fn] = f.bind(o,o)
  }
    
  if( o && o.unbless ) return o // already blessed
  for( var i in _ ) o[i] = _[i].bind(o,o)
  return o
}

