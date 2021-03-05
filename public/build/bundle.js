
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Modal.svelte generated by Svelte v3.35.0 */

    const file$1 = "src/Modal.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let p0;
    	let t0;
    	let strong0;
    	let t2;
    	let p1;
    	let t3;
    	let span0;
    	let t5;
    	let strong1;
    	let t7;
    	let strong2;
    	let t9;
    	let meta0;
    	let strong3;
    	let t10;
    	let meta1;
    	let span1;
    	let t12;
    	let t13;
    	let p2;
    	let t14;
    	let span2;
    	let t16;
    	let strong4;
    	let t18;
    	let meta2;
    	let span3;
    	let strong5;
    	let t21;
    	let t22;
    	let p3;
    	let t23;
    	let span4;
    	let t25;
    	let strong6;
    	let t27;
    	let p4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text("This is a visual representation of the infamous sin and cosine functions from that bullshit high school trig class wherein you were constantly asking yourself \"");
    			strong0 = element("strong");
    			strong0.textContent = "When the f*#k am I going to use this shit\"";
    			t2 = space();
    			p1 = element("p");
    			t3 = text("The ");
    			span0 = element("span");
    			span0.textContent = "blue";
    			t5 = text(" dot is the ");
    			strong1 = element("strong");
    			strong1.textContent = "X";
    			t7 = text(" coordinate mapping of the red dot (");
    			strong2 = element("strong");
    			strong2.textContent = "sin";
    			t9 = space();
    			meta0 = element("meta");
    			strong3 = element("strong");
    			t10 = text("(angle) * radius,\n          ");
    			meta1 = element("meta");
    			span1 = element("span");
    			span1.textContent = "constantY";
    			t12 = text(")");
    			t13 = space();
    			p2 = element("p");
    			t14 = text("The ");
    			span2 = element("span");
    			span2.textContent = "green";
    			t16 = text(" dot is the ");
    			strong4 = element("strong");
    			strong4.textContent = "Y";
    			t18 = text(" coordinate mapping of the red dot (\n      ");
    			meta2 = element("meta");
    			span3 = element("span");
    			span3.textContent = "constantX, ";
    			strong5 = element("strong");
    			strong5.textContent = "cos(angle) * radius";
    			t21 = text(")");
    			t22 = space();
    			p3 = element("p");
    			t23 = text("The ");
    			span4 = element("span");
    			span4.textContent = "red";
    			t25 = text(" dot is the point ");
    			strong6 = element("strong");
    			strong6.textContent = "(X, Y)";
    			t27 = space();
    			p4 = element("p");
    			p4.textContent = "Side note, can you see if you can see how triangles show up? A better name for trigonometry could be the circular functions. Triangles are emergent though.";
    			add_location(strong0, file$1, 1, 170, 190);
    			add_location(p0, file$1, 1, 2, 22);
    			set_style(span0, "color", "rgb(21, 40, 209)");
    			add_location(span0, file$1, 2, 9, 268);
    			add_location(strong1, file$1, 2, 71, 330);
    			add_location(strong2, file$1, 2, 125, 384);
    			attr_dev(meta0, "charset", "utf-8");
    			add_location(meta0, file$1, 3, 6, 411);
    			attr_dev(meta1, "charset", "utf-8");
    			add_location(meta1, file$1, 4, 10, 912);
    			set_style(span1, "color", "rgb(0, 0, 0)");
    			set_style(span1, "font-family", "Times");
    			set_style(span1, "font-size", "medium");
    			set_style(span1, "font-style", "normal");
    			set_style(span1, "font-variant-ligatures", "normal");
    			set_style(span1, "font-variant-caps", "normal");
    			set_style(span1, "font-weight", "400");
    			set_style(span1, "letter-spacing", "normal");
    			set_style(span1, "orphans", "2");
    			set_style(span1, "text-align", "start");
    			set_style(span1, "text-indent", "0px");
    			set_style(span1, "text-transform", "none");
    			set_style(span1, "white-space", "normal");
    			set_style(span1, "widows", "2");
    			set_style(span1, "word-spacing", "0px");
    			set_style(span1, "-webkit-text-stroke-width", "0px");
    			set_style(span1, "text-decoration-thickness", "initial");
    			set_style(span1, "text-decoration-style", "initial");
    			set_style(span1, "text-decoration-color", "initial");
    			set_style(span1, "display", "inline", 1);
    			set_style(span1, "float", "none");
    			add_location(span1, file$1, 4, 32, 934);
    			set_style(strong3, "font-weight", "700");
    			set_style(strong3, "color", "rgb(0, 0, 0)");
    			set_style(strong3, "font-family", "Times");
    			set_style(strong3, "font-size", "medium");
    			set_style(strong3, "font-style", "normal");
    			set_style(strong3, "font-variant-ligatures", "normal");
    			set_style(strong3, "font-variant-caps", "normal");
    			set_style(strong3, "letter-spacing", "normal");
    			set_style(strong3, "orphans", "2");
    			set_style(strong3, "text-align", "start");
    			set_style(strong3, "text-indent", "0px");
    			set_style(strong3, "text-transform", "none");
    			set_style(strong3, "white-space", "normal");
    			set_style(strong3, "widows", "2");
    			set_style(strong3, "word-spacing", "0px");
    			set_style(strong3, "-webkit-text-stroke-width", "0px");
    			set_style(strong3, "text-decoration-thickness", "initial");
    			set_style(strong3, "text-decoration-style", "initial");
    			set_style(strong3, "text-decoration-color", "initial");
    			add_location(strong3, file$1, 3, 28, 433);
    			add_location(p1, file$1, 2, 2, 261);
    			set_style(span2, "color", "rgb(34, 209, 21)");
    			add_location(span2, file$1, 5, 9, 1464);
    			add_location(strong4, file$1, 5, 72, 1527);
    			attr_dev(meta2, "charset", "utf-8");
    			add_location(meta2, file$1, 6, 6, 1588);
    			set_style(span3, "color", "rgb(0, 0, 0)");
    			set_style(span3, "font-family", "Times");
    			set_style(span3, "font-size", "medium");
    			set_style(span3, "font-style", "normal");
    			set_style(span3, "font-variant-ligatures", "normal");
    			set_style(span3, "font-variant-caps", "normal");
    			set_style(span3, "font-weight", "400");
    			set_style(span3, "letter-spacing", "normal");
    			set_style(span3, "orphans", "2");
    			set_style(span3, "text-align", "start");
    			set_style(span3, "text-indent", "0px");
    			set_style(span3, "text-transform", "none");
    			set_style(span3, "white-space", "normal");
    			set_style(span3, "widows", "2");
    			set_style(span3, "word-spacing", "0px");
    			set_style(span3, "-webkit-text-stroke-width", "0px");
    			set_style(span3, "text-decoration-thickness", "initial");
    			set_style(span3, "text-decoration-style", "initial");
    			set_style(span3, "text-decoration-color", "initial");
    			set_style(span3, "display", "inline", 1);
    			set_style(span3, "float", "none");
    			add_location(span3, file$1, 6, 28, 1610);
    			add_location(strong5, file$1, 6, 541, 2123);
    			add_location(p2, file$1, 5, 2, 1457);
    			set_style(span4, "color", "rgb(219, 44, 29)");
    			add_location(span4, file$1, 7, 9, 2174);
    			add_location(strong6, file$1, 7, 76, 2241);
    			add_location(p3, file$1, 7, 2, 2167);
    			add_location(p4, file$1, 8, 2, 2271);
    			attr_dev(div, "class", "modal svelte-bjvj3w");
    			add_location(div, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, strong0);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(p1, span0);
    			append_dev(p1, t5);
    			append_dev(p1, strong1);
    			append_dev(p1, t7);
    			append_dev(p1, strong2);
    			append_dev(p1, t9);
    			append_dev(p1, meta0);
    			append_dev(p1, strong3);
    			append_dev(strong3, t10);
    			append_dev(strong3, meta1);
    			append_dev(strong3, span1);
    			append_dev(p1, t12);
    			append_dev(div, t13);
    			append_dev(div, p2);
    			append_dev(p2, t14);
    			append_dev(p2, span2);
    			append_dev(p2, t16);
    			append_dev(p2, strong4);
    			append_dev(p2, t18);
    			append_dev(p2, meta2);
    			append_dev(p2, span3);
    			append_dev(p2, strong5);
    			append_dev(p2, t21);
    			append_dev(div, t22);
    			append_dev(div, p3);
    			append_dev(p3, t23);
    			append_dev(p3, span4);
    			append_dev(p3, t25);
    			append_dev(p3, strong6);
    			append_dev(div, t27);
    			append_dev(div, p4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.35.0 */
    const file = "src/App.svelte";

    // (153:1) {#if explainer}
    function create_if_block(ctx) {
    	let modal;
    	let current;
    	modal = new Modal({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(153:1) {#if explainer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div0;
    	let canvas_1;
    	let t0;
    	let t1;
    	let form;
    	let div1;
    	let h2;
    	let t3;
    	let input0;
    	let t4;
    	let label0;
    	let t6;
    	let input1;
    	let t7;
    	let label1;
    	let t9;
    	let input2;
    	let t10;
    	let h30;
    	let t12;
    	let div2;
    	let label2;
    	let t14;
    	let input3;
    	let t15;
    	let label3;
    	let t17;
    	let input4;
    	let t18;
    	let h31;
    	let t20;
    	let div3;
    	let label4;
    	let t22;
    	let input5;
    	let t23;
    	let label5;
    	let t25;
    	let input6;
    	let t26;
    	let h32;
    	let t28;
    	let div4;
    	let label6;
    	let t30;
    	let input7;
    	let t31;
    	let label7;
    	let t33;
    	let input8;
    	let t34;
    	let label8;
    	let t36;
    	let input9;
    	let t37;
    	let label9;
    	let t39;
    	let input10;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*explainer*/ ctx[11] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			canvas_1 = element("canvas");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			form = element("form");
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Please explain:";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label0 = element("label");
    			label0.textContent = "Speed";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			label1 = element("label");
    			label1.textContent = "Radius";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			h30 = element("h3");
    			h30.textContent = "Start here";
    			t12 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "X Axis";
    			t14 = space();
    			input3 = element("input");
    			t15 = space();
    			label3 = element("label");
    			label3.textContent = "Y Axis";
    			t17 = space();
    			input4 = element("input");
    			t18 = space();
    			h31 = element("h3");
    			h31.textContent = "Little more context";
    			t20 = space();
    			div3 = element("div");
    			label4 = element("label");
    			label4.textContent = "Show circle";
    			t22 = space();
    			input5 = element("input");
    			t23 = space();
    			label5 = element("label");
    			label5.textContent = "Show dot";
    			t25 = space();
    			input6 = element("input");
    			t26 = space();
    			h32 = element("h3");
    			h32.textContent = "A little more";
    			t28 = space();
    			div4 = element("div");
    			label6 = element("label");
    			label6.textContent = "Y line";
    			t30 = space();
    			input7 = element("input");
    			t31 = space();
    			label7 = element("label");
    			label7.textContent = "X line";
    			t33 = space();
    			input8 = element("input");
    			t34 = space();
    			label8 = element("label");
    			label8.textContent = "XY connection line";
    			t36 = space();
    			input9 = element("input");
    			t37 = space();
    			label9 = element("label");
    			label9.textContent = "Bisecting line";
    			t39 = space();
    			input10 = element("input");
    			attr_dev(canvas_1, "height", height);
    			attr_dev(canvas_1, "width", width);
    			attr_dev(canvas_1, "class", "svelte-4tmhwh");
    			add_location(canvas_1, file, 151, 1, 3170);
    			add_location(div0, file, 150, 0, 3163);
    			attr_dev(h2, "class", "svelte-4tmhwh");
    			add_location(h2, file, 158, 2, 3314);
    			attr_dev(input0, "type", "checkbox");
    			attr_dev(input0, "name", "explainer");
    			attr_dev(input0, "class", "svelte-4tmhwh");
    			add_location(input0, file, 159, 2, 3342);
    			attr_dev(div1, "class", "container svelte-4tmhwh");
    			add_location(div1, file, 157, 1, 3288);
    			attr_dev(label0, "for", "speed");
    			attr_dev(label0, "class", "svelte-4tmhwh");
    			add_location(label0, file, 162, 1, 3421);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", ".1");
    			attr_dev(input1, "max", "10");
    			attr_dev(input1, "name", "speed");
    			attr_dev(input1, "step", ".1");
    			attr_dev(input1, "class", "svelte-4tmhwh");
    			add_location(input1, file, 163, 2, 3456);
    			attr_dev(label1, "for", "radius");
    			attr_dev(label1, "class", "svelte-4tmhwh");
    			add_location(label1, file, 165, 1, 3540);
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "min", "10");
    			attr_dev(input2, "max", /*yCenter*/ ctx[12]);
    			attr_dev(input2, "name", "radius");
    			attr_dev(input2, "step", ".1");
    			attr_dev(input2, "class", "svelte-4tmhwh");
    			add_location(input2, file, 166, 2, 3577);
    			attr_dev(h30, "class", "svelte-4tmhwh");
    			add_location(h30, file, 171, 1, 3816);
    			attr_dev(label2, "for", "xAxis");
    			attr_dev(label2, "class", "svelte-4tmhwh");
    			add_location(label2, file, 175, 2, 3869);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "name", "xAxis");
    			attr_dev(input3, "class", "svelte-4tmhwh");
    			add_location(input3, file, 176, 2, 3905);
    			attr_dev(label3, "for", "yAxis");
    			attr_dev(label3, "class", "svelte-4tmhwh");
    			add_location(label3, file, 178, 2, 3970);
    			attr_dev(input4, "type", "checkbox");
    			attr_dev(input4, "name", "yAxis");
    			attr_dev(input4, "class", "svelte-4tmhwh");
    			add_location(input4, file, 179, 2, 4006);
    			attr_dev(div2, "class", "container svelte-4tmhwh");
    			add_location(div2, file, 174, 1, 3843);
    			attr_dev(h31, "class", "svelte-4tmhwh");
    			add_location(h31, file, 182, 1, 4079);
    			attr_dev(label4, "for", "circle");
    			attr_dev(label4, "class", "svelte-4tmhwh");
    			add_location(label4, file, 186, 2, 4140);
    			attr_dev(input5, "type", "checkbox");
    			attr_dev(input5, "name", "circle");
    			attr_dev(input5, "class", "svelte-4tmhwh");
    			add_location(input5, file, 187, 2, 4182);
    			attr_dev(label5, "for", "redDot");
    			attr_dev(label5, "class", "svelte-4tmhwh");
    			add_location(label5, file, 189, 2, 4249);
    			attr_dev(input6, "type", "checkbox");
    			attr_dev(input6, "name", "redDot");
    			attr_dev(input6, "class", "svelte-4tmhwh");
    			add_location(input6, file, 190, 2, 4288);
    			attr_dev(div3, "class", "container svelte-4tmhwh");
    			add_location(div3, file, 185, 1, 4114);
    			attr_dev(h32, "class", "svelte-4tmhwh");
    			add_location(h32, file, 193, 1, 4363);
    			attr_dev(label6, "for", "yLine");
    			attr_dev(label6, "class", "svelte-4tmhwh");
    			add_location(label6, file, 197, 2, 4418);
    			attr_dev(input7, "type", "checkbox");
    			attr_dev(input7, "name", "yLine");
    			attr_dev(input7, "class", "svelte-4tmhwh");
    			add_location(input7, file, 198, 2, 4454);
    			attr_dev(label7, "for", "xLine");
    			attr_dev(label7, "class", "svelte-4tmhwh");
    			add_location(label7, file, 200, 2, 4521);
    			attr_dev(input8, "type", "checkbox");
    			attr_dev(input8, "name", "xLine");
    			attr_dev(input8, "class", "svelte-4tmhwh");
    			add_location(input8, file, 201, 3, 4558);
    			attr_dev(label8, "for", "xyLine");
    			attr_dev(label8, "class", "svelte-4tmhwh");
    			add_location(label8, file, 203, 2, 4625);
    			attr_dev(input9, "type", "checkbox");
    			attr_dev(input9, "name", "xyLine");
    			attr_dev(input9, "class", "svelte-4tmhwh");
    			add_location(input9, file, 204, 2, 4674);
    			attr_dev(label9, "for", "biLine");
    			attr_dev(label9, "class", "svelte-4tmhwh");
    			add_location(label9, file, 206, 2, 4743);
    			attr_dev(input10, "type", "checkbox");
    			attr_dev(input10, "name", "biLine");
    			attr_dev(input10, "class", "svelte-4tmhwh");
    			add_location(input10, file, 207, 2, 4788);
    			attr_dev(div4, "class", "container svelte-4tmhwh");
    			add_location(div4, file, 196, 1, 4392);
    			add_location(form, file, 156, 0, 3280);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, canvas_1);
    			/*canvas_1_binding*/ ctx[16](canvas_1);
    			append_dev(div0, t0);
    			if (if_block) if_block.m(div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, div1);
    			append_dev(div1, h2);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			input0.checked = /*explainer*/ ctx[11];
    			append_dev(form, t4);
    			append_dev(form, label0);
    			append_dev(form, t6);
    			append_dev(form, input1);
    			set_input_value(input1, /*speed*/ ctx[1]);
    			append_dev(form, t7);
    			append_dev(form, label1);
    			append_dev(form, t9);
    			append_dev(form, input2);
    			set_input_value(input2, /*radius*/ ctx[0]);
    			append_dev(form, t10);
    			append_dev(form, h30);
    			append_dev(form, t12);
    			append_dev(form, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t14);
    			append_dev(div2, input3);
    			input3.checked = /*showXAxis*/ ctx[8];
    			append_dev(div2, t15);
    			append_dev(div2, label3);
    			append_dev(div2, t17);
    			append_dev(div2, input4);
    			input4.checked = /*showYAxis*/ ctx[7];
    			append_dev(form, t18);
    			append_dev(form, h31);
    			append_dev(form, t20);
    			append_dev(form, div3);
    			append_dev(div3, label4);
    			append_dev(div3, t22);
    			append_dev(div3, input5);
    			input5.checked = /*showCircle*/ ctx[9];
    			append_dev(div3, t23);
    			append_dev(div3, label5);
    			append_dev(div3, t25);
    			append_dev(div3, input6);
    			input6.checked = /*showRedDot*/ ctx[10];
    			append_dev(form, t26);
    			append_dev(form, h32);
    			append_dev(form, t28);
    			append_dev(form, div4);
    			append_dev(div4, label6);
    			append_dev(div4, t30);
    			append_dev(div4, input7);
    			input7.checked = /*showYLine*/ ctx[3];
    			append_dev(div4, t31);
    			append_dev(div4, label7);
    			append_dev(div4, t33);
    			append_dev(div4, input8);
    			input8.checked = /*showXLine*/ ctx[4];
    			append_dev(div4, t34);
    			append_dev(div4, label8);
    			append_dev(div4, t36);
    			append_dev(div4, input9);
    			input9.checked = /*showXYLine*/ ctx[6];
    			append_dev(div4, t37);
    			append_dev(div4, label9);
    			append_dev(div4, t39);
    			append_dev(div4, input10);
    			input10.checked = /*showBiLine*/ ctx[5];
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[17]),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[18]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[18]),
    					listen_dev(input2, "change", /*input2_change_input_handler*/ ctx[19]),
    					listen_dev(input2, "input", /*input2_change_input_handler*/ ctx[19]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[20]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[21]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[22]),
    					listen_dev(input6, "change", /*input6_change_handler*/ ctx[23]),
    					listen_dev(input7, "change", /*input7_change_handler*/ ctx[24]),
    					listen_dev(input8, "change", /*input8_change_handler*/ ctx[25]),
    					listen_dev(input9, "change", /*input9_change_handler*/ ctx[26]),
    					listen_dev(input10, "change", /*input10_change_handler*/ ctx[27])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*explainer*/ ctx[11]) {
    				if (if_block) {
    					if (dirty[0] & /*explainer*/ 2048) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*explainer*/ 2048) {
    				input0.checked = /*explainer*/ ctx[11];
    			}

    			if (dirty[0] & /*speed*/ 2) {
    				set_input_value(input1, /*speed*/ ctx[1]);
    			}

    			if (dirty[0] & /*radius*/ 1) {
    				set_input_value(input2, /*radius*/ ctx[0]);
    			}

    			if (dirty[0] & /*showXAxis*/ 256) {
    				input3.checked = /*showXAxis*/ ctx[8];
    			}

    			if (dirty[0] & /*showYAxis*/ 128) {
    				input4.checked = /*showYAxis*/ ctx[7];
    			}

    			if (dirty[0] & /*showCircle*/ 512) {
    				input5.checked = /*showCircle*/ ctx[9];
    			}

    			if (dirty[0] & /*showRedDot*/ 1024) {
    				input6.checked = /*showRedDot*/ ctx[10];
    			}

    			if (dirty[0] & /*showYLine*/ 8) {
    				input7.checked = /*showYLine*/ ctx[3];
    			}

    			if (dirty[0] & /*showXLine*/ 16) {
    				input8.checked = /*showXLine*/ ctx[4];
    			}

    			if (dirty[0] & /*showXYLine*/ 64) {
    				input9.checked = /*showXYLine*/ ctx[6];
    			}

    			if (dirty[0] & /*showBiLine*/ 32) {
    				input10.checked = /*showBiLine*/ ctx[5];
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			/*canvas_1_binding*/ ctx[16](null);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const height = 500;
    const width = 500;

    function instance($$self, $$props, $$invalidate) {
    	let angleSpeed;
    	let x;
    	let y;
    	let verticalLine;
    	let horizontalLine;
    	let betweenXY;
    	let bisectingLine;
    	let xLine;
    	let yLine;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let canvas;
    	let ctx;
    	let RED = "#db2c1d";
    	let BLUE = "#1528d1";
    	let GREEN = "#22d115";
    	const yCenter = Number.parseFloat(height / 2);
    	const xCenter = Number.parseFloat(width / 2);
    	let radius = 150;
    	let degrees = 0;
    	const startingPoint = { x: xCenter, y: yCenter };
    	let angle = 0;
    	let speed = 1;
    	let numDots = 9;
    	let points = [];
    	let showYLine = false;
    	let showXLine = false;
    	let showBiLine = false;
    	let showXYLine = false;
    	let showYAxis = false;
    	let showXAxis = false;
    	let showCircle = false;
    	let showRedDot = false;
    	let explainer = false;

    	onMount(() => {
    		ctx = canvas.getContext("2d");

    		// 		for (var i = 1; i <= numDots; i++) {
    		// 			let [dotx,doty] = calcPoint(i, numDots);
    		// 			points.push({startx: dotx, starty: doty})
    		// 		}
    		window.requestAnimationFrame(draw);
    	});

    	afterUpdate(async () => {
    		await tick();
    	});

    	function calcPoint(currentPoint, totalPoints) {
    		var theta = Math.PI * 2 / totalPoints;
    		var a = theta * currentPoint;
    		let dotx = radius * Math.cos(a + currentPoint) + startingPoint.x;
    		let doty = radius * Math.sin(a + currentPoint) + startingPoint.y;
    		return [dotx, doty];
    	}

    	function drawDot(x, y, color = "#000") {
    		ctx.beginPath();
    		ctx.arc(x, y, 5, 0, 2 * Math.PI);
    		ctx.fillStyle = color;
    		ctx.closePath();
    		ctx.fill();
    	}

    	function drawCircle() {
    		ctx.beginPath();
    		ctx.arc(xCenter, yCenter, radius, 0, 2 * Math.PI);
    		ctx.stroke();
    	}

    	function drawLine({ begin, end }) {
    		//Vertical line
    		ctx.beginPath();

    		ctx.moveTo(begin.x, begin.y);
    		ctx.lineTo(end.x, end.y);
    		ctx.closePath();
    		ctx.stroke();
    	}

    	function drawLines() {
    		if (showXYLine) drawLine(betweenXY);
    		if (showYAxis) drawLine(verticalLine);
    		if (showXAxis) drawLine(horizontalLine);
    		if (showBiLine) drawLine(bisectingLine);
    		if (showXLine) drawLine(xLine);
    		if (showYLine) drawLine(yLine);
    	}

    	function draw() {
    		degrees = 360 / (2 * Math.PI * radius);

    		$$invalidate(13, angle = angle < -6.3
    		? $$invalidate(13, angle = 0)
    		: angle - angleSpeed);

    		ctx.clearRect(0, 0, canvas.width, canvas.height);
    		if (showCircle) drawCircle();

    		// X, Y
    		if (showRedDot) drawDot(x, y, RED);

    		// X mapping
    		drawDot(x, 250, BLUE);

    		// Y mapping
    		drawDot(250, y, GREEN);

    		// 		points.forEach((point)=>{
    		// 			calcPoint(point)
    		// 			drawDot(point.startx, point.starty)
    		// 		})
    		drawLines();

    		window.requestAnimationFrame(draw);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(2, canvas);
    		});
    	}

    	function input0_change_handler() {
    		explainer = this.checked;
    		$$invalidate(11, explainer);
    	}

    	function input1_change_input_handler() {
    		speed = to_number(this.value);
    		$$invalidate(1, speed);
    	}

    	function input2_change_input_handler() {
    		radius = to_number(this.value);
    		$$invalidate(0, radius);
    	}

    	function input3_change_handler() {
    		showXAxis = this.checked;
    		$$invalidate(8, showXAxis);
    	}

    	function input4_change_handler() {
    		showYAxis = this.checked;
    		$$invalidate(7, showYAxis);
    	}

    	function input5_change_handler() {
    		showCircle = this.checked;
    		$$invalidate(9, showCircle);
    	}

    	function input6_change_handler() {
    		showRedDot = this.checked;
    		$$invalidate(10, showRedDot);
    	}

    	function input7_change_handler() {
    		showYLine = this.checked;
    		$$invalidate(3, showYLine);
    	}

    	function input8_change_handler() {
    		showXLine = this.checked;
    		$$invalidate(4, showXLine);
    	}

    	function input9_change_handler() {
    		showXYLine = this.checked;
    		$$invalidate(6, showXYLine);
    	}

    	function input10_change_handler() {
    		showBiLine = this.checked;
    		$$invalidate(5, showBiLine);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		tick,
    		Modal,
    		canvas,
    		ctx,
    		height,
    		width,
    		RED,
    		BLUE,
    		GREEN,
    		yCenter,
    		xCenter,
    		radius,
    		degrees,
    		startingPoint,
    		angle,
    		speed,
    		numDots,
    		points,
    		showYLine,
    		showXLine,
    		showBiLine,
    		showXYLine,
    		showYAxis,
    		showXAxis,
    		showCircle,
    		showRedDot,
    		explainer,
    		calcPoint,
    		drawDot,
    		drawCircle,
    		drawLine,
    		drawLines,
    		draw,
    		angleSpeed,
    		x,
    		y,
    		verticalLine,
    		horizontalLine,
    		betweenXY,
    		bisectingLine,
    		xLine,
    		yLine
    	});

    	$$self.$inject_state = $$props => {
    		if ("canvas" in $$props) $$invalidate(2, canvas = $$props.canvas);
    		if ("ctx" in $$props) ctx = $$props.ctx;
    		if ("RED" in $$props) RED = $$props.RED;
    		if ("BLUE" in $$props) BLUE = $$props.BLUE;
    		if ("GREEN" in $$props) GREEN = $$props.GREEN;
    		if ("radius" in $$props) $$invalidate(0, radius = $$props.radius);
    		if ("degrees" in $$props) degrees = $$props.degrees;
    		if ("angle" in $$props) $$invalidate(13, angle = $$props.angle);
    		if ("speed" in $$props) $$invalidate(1, speed = $$props.speed);
    		if ("numDots" in $$props) numDots = $$props.numDots;
    		if ("points" in $$props) points = $$props.points;
    		if ("showYLine" in $$props) $$invalidate(3, showYLine = $$props.showYLine);
    		if ("showXLine" in $$props) $$invalidate(4, showXLine = $$props.showXLine);
    		if ("showBiLine" in $$props) $$invalidate(5, showBiLine = $$props.showBiLine);
    		if ("showXYLine" in $$props) $$invalidate(6, showXYLine = $$props.showXYLine);
    		if ("showYAxis" in $$props) $$invalidate(7, showYAxis = $$props.showYAxis);
    		if ("showXAxis" in $$props) $$invalidate(8, showXAxis = $$props.showXAxis);
    		if ("showCircle" in $$props) $$invalidate(9, showCircle = $$props.showCircle);
    		if ("showRedDot" in $$props) $$invalidate(10, showRedDot = $$props.showRedDot);
    		if ("explainer" in $$props) $$invalidate(11, explainer = $$props.explainer);
    		if ("angleSpeed" in $$props) angleSpeed = $$props.angleSpeed;
    		if ("x" in $$props) $$invalidate(14, x = $$props.x);
    		if ("y" in $$props) $$invalidate(15, y = $$props.y);
    		if ("verticalLine" in $$props) verticalLine = $$props.verticalLine;
    		if ("horizontalLine" in $$props) horizontalLine = $$props.horizontalLine;
    		if ("betweenXY" in $$props) betweenXY = $$props.betweenXY;
    		if ("bisectingLine" in $$props) bisectingLine = $$props.bisectingLine;
    		if ("xLine" in $$props) xLine = $$props.xLine;
    		if ("yLine" in $$props) yLine = $$props.yLine;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*speed*/ 2) {
    			angleSpeed = speed / 100;
    		}

    		if ($$self.$$.dirty[0] & /*angle, radius*/ 8193) {
    			$$invalidate(14, x = startingPoint.x + Math.cos(angle) * radius);
    		}

    		if ($$self.$$.dirty[0] & /*angle, radius*/ 8193) {
    			$$invalidate(15, y = startingPoint.y + Math.sin(angle) * radius);
    		}

    		if ($$self.$$.dirty[0] & /*radius*/ 1) {
    			verticalLine = {
    				begin: { x: xCenter, y: xCenter - radius },
    				end: { x: yCenter, y: yCenter + radius }
    			};
    		}

    		if ($$self.$$.dirty[0] & /*radius*/ 1) {
    			horizontalLine = {
    				begin: { x: xCenter - radius, y: yCenter },
    				end: { x: xCenter + radius, y: yCenter }
    			};
    		}

    		if ($$self.$$.dirty[0] & /*x, y*/ 49152) {
    			betweenXY = {
    				begin: { x, y: yCenter },
    				end: { x: xCenter, y }
    			};
    		}

    		if ($$self.$$.dirty[0] & /*x, y*/ 49152) {
    			bisectingLine = {
    				begin: { x: xCenter, y: yCenter },
    				end: { x, y }
    			};
    		}

    		if ($$self.$$.dirty[0] & /*x, y*/ 49152) {
    			xLine = { begin: { x, y: xCenter }, end: { x, y } };
    		}

    		if ($$self.$$.dirty[0] & /*y, x*/ 49152) {
    			yLine = { begin: { x: xCenter, y }, end: { x, y } };
    		}
    	};

    	return [
    		radius,
    		speed,
    		canvas,
    		showYLine,
    		showXLine,
    		showBiLine,
    		showXYLine,
    		showYAxis,
    		showXAxis,
    		showCircle,
    		showRedDot,
    		explainer,
    		yCenter,
    		angle,
    		x,
    		y,
    		canvas_1_binding,
    		input0_change_handler,
    		input1_change_input_handler,
    		input2_change_input_handler,
    		input3_change_handler,
    		input4_change_handler,
    		input5_change_handler,
    		input6_change_handler,
    		input7_change_handler,
    		input8_change_handler,
    		input9_change_handler,
    		input10_change_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
