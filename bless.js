/*
 * http://coderofsalvation.github.io/bless
 *
 * USAGE:
 *
 *
 * var data = { foo:[{a:1},{a:2}], b:1 }
 * bless(data)
 *
 * data.set( 'bar.a.b', [] )
 *     .get( 'foo' )
 *     .each( (v,k) => data.bar.a.b.push(v.a) )
 *     .get( 'bar.a.b' )
 *     .map(  (v,k)      => v*=10 )
 *     .each( (v,k)      => console.log(v) )
 *     .clone()
 *     .on('foo:before', () => console.log('before foo!') )
 *     .foo
 *     .each( (v,k,next) => {
 *         fetch(`/endpoint?v=${v}`,{method:'POST'})
 *         .then(  (r) => r.json() )
 *         .then(  (j) => data.bar.a.b[k] = j )
 *         .then(  ( ) => next( ) )
 *         .catch( (e) => next(e) )
 *     },{halterror:false})
 *     .then(  ( )  => console.log(`done`) )
 *     .catch( (e)  => console.log(`oops: ${e}`) )
 *
 * data.mixin('foo',     () => console.log(2) )
 * data.on('foo:before', () => console.log(1) )
 * data.on('foo',        () => console.log(3) )
 * data.foo() // outputs 1,2,3
 *
 * data.on('bar', (i) => console.log(i) )
 * data.emit('bar',2) // outputs 2
 *
 */
// bless() - https://gist.github.com/coderofsalvation/61dd5c86b81e4ca6963ed0535bd806e7
var bless
bless = function(a){
    // *TODO* fix JSON.stringify(blessedobject) issue
    if( !a || a.unbless ) return a
    a.__proto__ = { __proto__: a.__proto__ }
    var prot = a.__proto__
    prot.mixin = (fn,f) => prot[fn] = function(){
        a.emit(fn+':before',arguments)
        f.apply(this,arguments)
        a.emit(fn,arguments)
        return a
    }
    prot.debug = document.location.host.match(/localhost/) != null ? true: false
    
    prot.unbless = () => { a.__proto__ = a.__proto__._p; return a; }
    for( var i in bless ) prot[i] = bless[i].bind(a,a)
    a.eventemitter()
    return a
}

bless.valid = function(
  a,                                    // (optional) data object
  b                                     // (optional) schema
){
  var stringify = (a) => JSON.stringify(a,null,2)
  var schema = (a) => JSON.parse(
    stringify(a)
    .replace(/:[ ]?".*"/g,'        : "string"')
    .replace(/:[ ]?[0-9]+/g,'      : "number"')
    .replace(/:[ ]?(true|false)/g,': "boolean"')
  )
  var s = a.__proto__._schema ? a.__proto__._schema
                              : schema(a)
  if( stringify(schema(a)) != stringify(s) ){
    var err = "error:\n"+stringify(a)+"\ndoes not match schema:\n"+stringify(s)
    if(b) b(err)
    console.log(err)
  }
  if ( a && !a.__proto__._schema ){
    console.log("added schema")
    a.__proto__._data = JSON.parse(JSON.stringify(a))
    a.__proto__._schema = s
    a.__proto__.valid   = () => bless.bind(this,a)
    a.__proto__.schema  = () => a.__proto__._schema // expose schema
  }
  if( b ) a.__proto__._schema = b // overwrite schema
  return a
}

bless.get = function get(obj,x,fallback) {
    obj = obj || this
    var o = String(x).split('.').reduce(function(acc, x) {
        if (acc == null || acc == undefined ){
            bless.set(obj,x,fallback)
            return fallback;
        }
        return new Function("x","acc","return acc['" + x.split(".").join("']['") +"']" )(x, acc) || fallback
    }, obj)
    if( !o && obj.__proto__.parent && !fallback) o = bless.get(obj.__proto__.parent,x) // search parent object
    if( o && !o.unbless ){
        o = bless(o)
        o.__proto__.parent = obj //remember source object
    }
    return o
}

bless.set = function set(obj, path, value) {
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
  return obj//.unbless ? obj : bless(obj)
}

bless.pluck = function pluck(obj,arr){
    var o = {}
    arr.map( (l) => o[l] = bless.get(obj || this,l) )
    return bless(o)
}

var am = ['push','filter','find']
am.map( (m) => {
    bless[m] = function(method,obj,a,b,c){
        var o = bless.to.Array(obj)
        return bless( Array.prototype[m].call( o,a) )
    }.bind(null,m)
})

bless.omit = function omit(obj,arr) {
    var o = obj || this
    arr.map((l) => delete o[l])
    return bless(o)
}

bless.clone  = function(a){
  return bless( JSON.parse( JSON.stringify(a || this) ) )
}


bless.wrap = function wrap(obj, method, handler, context) {
        var org = obj[method];
        // Unpatch first if already patched.
        if (org.unwrap) {
                org = org.unwrap();
        }
        // Patch the function.
        obj[method] = function() {
                var ctx  = context || this;
                var args = [].slice.call(arguments);
                args.unshift(org.bind(ctx));
                return handler.apply(ctx, args);
        };
        // Provide "unpatch" function.
        obj[method].unwrap = function() {
                obj[method] = org;
                return org;
        };
        // Return the original.
        return org;
}

bless.rewind = (a) => {
  a = a || this
  for( var i in a.__proto__._data )
    a[i] = a.__proto__._data[i]
  return a
}

bless.eventemitter = function(o){
    o.events = {}
    o.emit = function(e,val){
      if( o.debug ) console.log(`.on('${e}',...)`)
      var evs = o.events[e] || []
      evs.map( function(f){ f(val) } )
      return o
    }
    o.on = function(e,f){
      var evs = o.events[e] || []
      evs.push(f)
      o.events[e] = evs
      return o
    }
}

bless.to
bless.to = function(a,type){
    return bless.to[ type.name ] ? bless.to[type.name](a) : a
}
bless.to.Array = function(a){
    if( a.pop ) return a.unbless ? a : bless(a) // already array
    if( typeof a == "object" ){
        var o = []
        Object.keys(a).map( (k) => { a[k].key = k; Array.prototype.push.call(o,a[k]) } )
        return bless(o)
    }
    return typeof a == "string" ? bless( Array.from(a) ) : bless([a])
}
bless.to.Object = function(a){
    if( type.name == "Object" ){
        if( ! a.length && a.valueOf ) return a.unbless ? a : bless(a) // already object
        var o = {}
        a.map( (v) => o[v.key] = v.data )
        return bless(o)
    }
}

bless.then = function(a,f){
/* *TODO*
    return new Promise( (resolve,reject) => {
        resolve( f(a) )
    })
*/
    if( typeof f == "function" ){
    	if( f.then && !f.unbless ) return f.then(a)
		return f(a)
    }
    return a
}

bless.map = function(a,cb){
    var b = a.pop    ? ( a.unbless ? a : bless(a) )
  	                 : ( a.unbless ? a.to(Array) : bless(a).to(Array) )
  	return bless( Array.prototype.map.call(b,cb) )
}

/*
 * _.each(arr_or_obj, cb, [next] )   (map with optional object & async support)
 *
 * calls cb(data, next) for each element in arr, and continues loop
 * based on next()-calls (last element propagates done()).
 * Perfect to iterate over an array synchronously,  while performing async
 * operations inbetween the elements.
 *
 * example:	_.each([1, 2, 3], (data,key,next) => next(), optional: {halterror:true}  )
 *           .then( ... )
 *
 */
bless.each = function each(a,cb,opts) {
  	opts = opts || {}
  	var b = a.pop    ? ( a.unbless ? a : bless(a) )
  	                 : ( a.unbless ? a.to(Array) : bless(a).to(Array))
  	var i = -1, length = b.length
  	var async = cb.length > 2
  	if( !async ){
  	    Array.prototype.map.call( b, cb )
  	    return a
  	}
	var p = new Promise( (resolve,reject) => {
	    var f
        f = function(err){
            try{
                if(err) throw err
                i++
                if( i >= b.length ) return resolve()
                cb( b[i], i, f)
            }catch (e){
                opts.halterror ? reject(e) : f()
            }
        }
        f()
    })
    bless(p)
    delete p.__proto__.then // delete bless.then to prevent infinite then-loop
    p.__proto__.parent = a  // set parent, so get() works again
    return p
}

if( typeof window != "undefined") window.bless = bless
if( typeof module != "undefined") module.exports = bless

export default bless
