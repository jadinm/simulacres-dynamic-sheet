class Model {
    // List all the Model or DataList classes that should be initialized prior to an instance of this model
    static requirements = []

    static numeric_inputs = [] // These inputs cannot be empty
    static basic_inputs = [] // List all the regular inputs, including numerical ones
    static radio_groups = {} // List of checkboxes grouped by radio group
    static independent_checkboxes = [] // List all checkboxes that are not part of a radio group
    static selects_no_sanitize = [] // These select pickers do not see their content sanitized and can include images
    static selects = [] // List of all select pickers, including the previous category
    static sliders = [] // List of all the sliders
    static save_slider_min_max = [] // Slider whose bounds can change and should be monitored (not by default because we might block future changes by doing so)
    static text_areas = [] // List of all the text areas
    static duplicated_inputs = {} // For each id as key, the list of suffixes that can be found to duplicate it with: key + "-"
    static save_input_classes = {} // For each id as key, the list of classes to monitor in the element (saved as boolean "<key>-<class>")

    static model_names = {} // sub-model classes of the form {id: model_class}

    static ignored_equals_keys = [] // List of any exported key that do not matter when checking the equality

    static suffix_inputs(items) {
        if (Array.isArray(items)) {
            return items.map((input) => {
                if (this.duplicated_inputs[input]) {
                    return this.duplicated_inputs[input].map((suffix) => {
                        return input + "-" + suffix
                    })
                } else {
                    return [input]
                }
            }).flat()
        } else {
            const new_object = {}
            for (const [key, value] of Object.entries(items)) {
                if (this.duplicated_inputs[key]) {
                    for (const suffix of this.duplicated_inputs[key]) {
                        new_object[key + "-" + suffix] = value
                    }
                } else {
                    new_object[key] = value
                }
            }
            return new_object
        }
    }

    static get_text_areas() {
        return this.suffix_inputs(this.text_areas)
    }

    static checkboxes() {
        return this.suffix_inputs([...this.independent_checkboxes, ...Object.values(this.radio_groups).flat()])
    }

    static input_sliders() {
        return this.suffix_inputs(this.sliders)
    }

    static inputs_and_selects() {
        return this.suffix_inputs([...this.basic_inputs, ...this.selects])
    }

    static all_inputs() {
        return [...this.inputs_and_selects(), ...this.checkboxes(), ...this.input_sliders(), ...this.get_text_areas()]
    }

    constructor(opts, other_html = null, prepare_arg = null, parent = null) {
        this.other_html = other_html
        this.missing_inputs = []
        this.invalid_values = {}
        this.unsync_values = {}
        this.unused_data = []
        this.missing_data = []
        this.id = null // No id by default
        this.parent = parent

        this.prepare(prepare_arg)

        this.models = {}
        for (const [key, model] of Object.entries(this.constructor.model_names)) {
            this.models[key] = new model(opts ? opts[key] : {}, other_html, prepare_arg ? prepare_arg[key] : {}, this)
        }

        this.update_data(opts)
        if (this.other_html === null) // No need to add listeners for another document
            this.add_listeners()
        if (this.missing_inputs.length > 0)
            logger.error("Missing inputs:", this.missing_inputs, "in", this.id ? this.id : typeof this)
        if (this.invalid_values.length > 0) {
            for (const [variable, value] of Object.entries(this.invalid_values)) {
                logger.error("Invalid value", value, "for variable", variable, "in", this.id ? this.id : typeof this)
            }
        }
    }

    clean_errors() {
        this.missing_inputs = []
        this.invalid_values = {}
        this.unsync_values = {}
        this.unused_data = {}
        this.missing_data = []
    }

    has_errors() {
        for (const model of Object.values(this.models)) {
            if (model.has_errors())
                return true
        }
        return this.missing_inputs.length > 0 || Object.keys(this.invalid_values).length > 0 || Object.keys(this.unsync_values).length > 0 || Object.keys(this.unused_data).length > 0 || (testing_sheet && this.missing_data.length > 0)
    }

    prepare() {
    }

    find(selector) {
        if (this.parent)
            return this.parent.find(selector)
        return this.other_html !== null ? this.other_html.find(selector) : $(selector)
    }

    get(id) {
        return this.find("#" + this.full_id(id))
    }

    full_id(base_id) {
        return this.parent ? this.parent.full_id(base_id) : base_id
    }

    local_id(base_id) {
        return this.parent ? this.parent.local_id(base_id) : base_id
    }

    /**
     * Checks whether the id would be handled by this model
     * @param id
     */
    has(id) {
        const all_inputs = this.constructor.all_inputs()
        for (const input of all_inputs) {
            if (this.local_id(id) === input)
                return true
        }
        for (const model of Object.values(this.models)) {
            if (model.has(id))
                return true
        }
        return false
    }

    /**
     * Check for errors such as missing inputs
     * @param all_inputs: by id, it gives the jquery object
     */
    sanity_check(all_inputs) {
        this.unsync_values = {}
        const all_vars = this.constructor.all_inputs()
        for (const variable of all_vars) {
            let candidate_base_id = this.full_id(variable)
            let elem = all_inputs[candidate_base_id]
            if (!elem) {
                if (!this.missing_inputs.includes(variable))
                    this.missing_inputs.push(variable)
                continue
            }

            // Check that values are matching
            if (elem.attr("data-max-options") === "1") {
                // select picker that is not really a multi-select, so this[variable] is transformed
                const original_variable = this[variable] == null ? [] : [this[variable]]
                const value = elem.val()
                if (JSON5.stringify(original_variable) !== JSON5.stringify(value)) // Normal comparison does not work with objects
                    this.unsync_values[variable] = [value, original_variable]
            } else if (elem.attr("type") === "checkbox") {
                if (this[variable] !== elem.prop("checked"))
                    this.unsync_values[variable] = [elem.prop("checked"), this[variable]]
            } else if (elem.attr("data-slider-value") != null) { // sliders that can be non-initialized
                const value = parseInt(elem.attr("data-slider-value")) || 0
                if (this[variable] !== value)
                    this.unsync_values[variable] = [value, this[variable]]
            } else if (typeof this[variable] === "number") {
                const value = parseInt(elem.val()) || 0
                if (this[variable] !== value)
                    this.unsync_values[variable] = [value, this[variable]]
            } else if (typeof this[variable] === "object") {
                const value = elem.val()
                if (JSON5.stringify(this[variable]) !== JSON5.stringify(value)) // Normal comparison does not work with objects
                    this.unsync_values[variable] = [value, this[variable]]
            } else if (elem[0].tagName === "TEXTAREA") {
                if (this[variable] !== elem.text())
                    this.unsync_values[variable] = [elem.text(), this[variable]]
            } else if (this[variable] !== elem.val()) {
                this.unsync_values[variable] = [elem.val(), this[variable]]
            }
        }

        // Check for slider max and min
        const save_slider_min_max = this.constructor.suffix_inputs(this.constructor.save_slider_min_max)
        for (const variable of save_slider_min_max) {
            for (const minmax of ["min", "max"]) {
                const minmax_var = variable + "." + minmax
                let candidate_base_id = this.full_id(variable)
                if (this.missing_inputs.includes(candidate_base_id)) { // Do not generate errors
                    continue
                }
                const actual_value = parseInt(all_inputs[candidate_base_id][0].getAttribute("data-slider-" + minmax)) || 0
                if (this[minmax_var] !== actual_value) {
                    this.unsync_values[minmax_var] = [actual_value, this[minmax_var]]
                }
            }
        }

        // Check for classes
        const save_input_classes = this.constructor.suffix_inputs(this.constructor.save_input_classes)
        for (const [variable, watched_classes] of Object.entries(save_input_classes)) {
            for (const watched_class of watched_classes) {
                const class_var = variable + "." + watched_class
                let candidate_base_id = this.full_id(variable)
                if (this.missing_inputs.includes(candidate_base_id)) { // Do not generate errors
                    continue
                }
                if (this[class_var] ^ all_inputs[candidate_base_id].hasClass(watched_class)) {
                    // The variable is true/false while the class is absent/present
                    this.unsync_values[class_var] = [all_inputs[candidate_base_id].hasClass(watched_class), this[class_var]]
                }
            }
        }

        for (const model of Object.values(this.models)) {
            model.sanity_check(all_inputs)
        }
    }

    add_listeners() {
        const basic_inputs = this.constructor.suffix_inputs(this.constructor.basic_inputs)
        const numeric_inputs = this.constructor.suffix_inputs(this.constructor.numeric_inputs)
        for (const variable of basic_inputs) {
            const elem = this.get(variable)
            elem.on("change", event => {
                event.target.setAttribute("value", event.target.value)
                this[variable] = event.target.value
                if (numeric_inputs.includes(variable))
                    this[variable] = parseInt(this[variable]) || 0
                mark_page_changed()
            })
            // Install input filters on number inputs
            if (numeric_inputs.includes(variable))
                elem.uon("input keydown keyup mousedown mouseup select contextmenu drop", number_input_key_event)
        }

        const checkboxes = this.constructor.checkboxes()
        for (const variable of checkboxes) {
            let group = []
            for (const radios of this.constructor.suffix_inputs(Object.values(this.constructor.radio_groups))) {
                if (radios.includes(variable))
                    group = radios
            }
            this.get(variable).on("click", event => {
                const checked = checkbox_click(event)
                for (const radio of group) {
                    this[radio] = false
                }
                this[variable] = checked
            })
        }

        // Initialize all select pickers (since they get destroyed at every load)
        const selects = this.constructor.suffix_inputs(this.constructor.selects)
        const sanitize = this.constructor.suffix_inputs(this.constructor.selects_no_sanitize)
        for (const variable of selects) {
            const ops = sanitize.includes(variable) ? {sanitize: false} : {}
            const elem = this.get(variable)
            elem.on("changed.bs.select", (event) => {
                this[variable] = select_change(event)
                if ($(event.target).attr("data-max-options") === "1") // multiple but not really
                    this[variable] = this[variable] && this[variable].length > 0 ? this[variable][0] : null
            }).selectpicker(ops)
            if (sanitize.includes(variable)) // Needed because images are sanitized
                elem.selectpicker('val', this[variable])
        }

        // Sliders will be initialized by subclasses since they are complicated
        // We only add base listener here
        const sliders = this.constructor.input_sliders()
        for (const slider of sliders) {
            this.get(slider).on("change", (event) => {
                this[slider] = parseInt(event.target.value) || 0
                event.target.setAttribute("value", event.target.value)
                event.target.setAttribute("data-value", event.target.value)
                event.target.setAttribute("data-slider-value", event.target.value)
                mark_page_changed()
            })
        }

        // Initialize text areas here
        const text_areas = this.constructor.get_text_areas()
        for (const area of text_areas) {
            const elem = this.get(area)
            if (elem.hasClass("summernote"))
                elem.on('summernote.change', (we, contents) => {
                    this[area] = contents
                    summer_note_listener(we, contents)
                })
            else
                elem.on("change", (e) => {
                    this[area] = e.target.value
                    $(e.target).text(e.target.value)
                    mark_page_changed()
                })
        }
    }

    add_saved_class_to(elem, class_name) {
        elem.addClass(class_name)
        this[elem[0].id + "." + class_name] = true
    }

    remove_saved_class_to(elem, class_name) {
        elem.removeClass(class_name)
        this[elem[0].id + "." + class_name] = false
    }

    set_slider_max(slider, new_max, set_value_to_max = false, set_value_to_min = false) {
        if (slider.length === 0)
            return
        const id = this.local_id(slider[0].id)
        this[id + ".max"] = new_max
        if (set_value_to_max)
            this[id] = this[id + ".max"]
        else if (set_value_to_min)
            this[id] = this[id + ".min"]
        set_slider_max(slider, new_max, set_value_to_max, set_value_to_min)
    }

    set_slider_min(slider, new_min) {
        if (slider.length === 0)
            return
        this[this.local_id(slider[0].id) + ".min"] = new_min
        set_slider_min(slider, new_min)
    }

    /**
     * @param import_opts
     * @returns {boolean} true if import_opts describe this model, and false otherwise
     */
    equals(import_opts) {
        const filtered_import_opts = structuredClone(import_opts)
        const exported_data = this.export()
        for (const ignored_key of this.constructor.ignored_equals_keys) {
            if (exported_data[ignored_key])
                delete exported_data[ignored_key]
            if (filtered_import_opts[ignored_key])
                delete filtered_import_opts[ignored_key]
        }
        return deepEqual(exported_data, filtered_import_opts)
    }

    /**
     * Merge import_opts into this model
     * This assumes that imports_opts were already checked by equals method
     * @param import_opts
     */
    merge(import_opts) {
        // Do nothing by default
    }

    write() {
        const base_input = this.constructor.suffix_inputs(this.constructor.basic_inputs)
        for (const variable of base_input) {
            this.get(variable).val(this[variable])
        }
        const selects = this.constructor.suffix_inputs(this.constructor.selects)
        for (const variable of selects) {
            this.get(variable).selectpicker("val", this[variable])
        }
        const checkboxes = this.constructor.checkboxes()
        for (const variable of checkboxes) {
            if (this[variable]) {
                check_radio(this.get(variable)[0])
            } else {
                uncheck_checkbox(this.get(variable)[0])
            }
        }
        const sliders = this.constructor.input_sliders()
        const save_slider_min_max = this.constructor.suffix_inputs(this.constructor.save_slider_min_max)
        for (let slider of sliders) {
            const slider_elem = this.get(slider)
            slider_elem.slider("setValue", this[slider])
            if (save_slider_min_max.includes(slider)) {
                set_slider_min(slider_elem, this[slider + ".min"])
                set_slider_max(slider_elem, this[slider + ".max"])
            }
        }
        const text_areas = this.constructor.get_text_areas()
        for (let area of text_areas) {
            this.get(area).html(this[area])
        }

        for (const model of Object.values(this.models)) {
            model.write()
        }
    }

    import(opts, full_opts, only_new_data) {
        for (const [key, model] of Object.entries(this.models)) {
            model.import(opts ? opts[key] : {}, full_opts, only_new_data)
        }

        this.clean_errors() // Only follow import errors from this point
        this.update_data(opts, true)
    }

    update_data(opts, updating_opts = false) {
        const checkboxes = this.constructor.checkboxes()
        const all_inputs = this.constructor.all_inputs()
        const sliders = this.constructor.input_sliders()
        const text_areas = this.constructor.get_text_areas()
        const selects = this.constructor.suffix_inputs(this.constructor.selects)
        const numeric_inputs = this.constructor.suffix_inputs(this.constructor.numeric_inputs)
        const save_slider_min_max = this.constructor.suffix_inputs(this.constructor.save_slider_min_max)
        const save_input_classes = this.constructor.suffix_inputs(this.constructor.save_input_classes)

        const used_vars = []
        for (const variable of all_inputs) {
            let element
            if (save_slider_min_max.includes(variable)) {
                for (const minmax of ["min", "max"]) {
                    const minmax_var = variable + "." + minmax
                    used_vars.push(minmax_var)
                    if (typeof opts === 'object' && opts !== null
                        && minmax_var in opts) {
                        if (updating_opts && this[minmax_var] !== opts[minmax_var]) {
                            this["set_slider_" + minmax](this.get(variable), opts[minmax_var])
                        } else {
                            this[minmax_var] = opts[minmax_var]
                        }
                    } else if (!updating_opts) { // Only on loading
                        element = this.get(variable)
                        if (element.length === 0) {
                            if (!this.missing_inputs.includes(variable))
                                this.missing_inputs.push(variable)
                        } else {
                            const value = element[0].getAttribute("data-slider-" + minmax)
                            if (isNaN(parseInt(value))) {
                                this.invalid_values[minmax_var] = value
                            } else {
                                this[minmax_var] = parseInt(value)
                            }
                        }
                    }
                    if (testing_sheet && updating_opts && opts && !(minmax_var in opts)) {
                        this.missing_data.push(minmax_var)
                    }
                }
            }

            if (variable in save_input_classes) {
                for (const class_name of save_input_classes[variable]) {
                    const class_var = variable + "." + class_name
                    used_vars.push(class_var)
                    if (typeof opts === 'object' && opts !== null
                        && class_var in opts) {
                        if (updating_opts && this[class_var] !== opts[class_var]) {
                            if (opts[class_var])
                                this.add_saved_class_to(this.get(variable), class_name)
                            else
                                this.remove_saved_class_to(this.get(variable), class_name)
                        } else {
                            this[class_var] = opts[class_var]
                        }
                    } else if (!updating_opts) {
                        element = this.get(variable)
                        if (element.length === 0) {
                            if (!this.missing_inputs.includes(variable))
                                this.missing_inputs.push(variable)
                        } else {
                            this[class_var] = element.hasClass(class_name)
                        }
                    }
                    if (testing_sheet && updating_opts && opts && !(class_var in opts)) {
                        this.missing_data.push(class_var)
                    }
                }
            }

            // Default to saved data
            used_vars.push(variable)
            if (typeof opts === 'object' && opts !== null
                && variable in opts && opts[variable] !== undefined) {

                if (updating_opts && this[variable] !== opts[variable]) { // Value should get updated by listeners
                    element = this.get(variable)
                    if (element.length === 0) { // Data lost on import
                        if (!this.missing_inputs.includes(variable))
                            this.missing_inputs.push(variable)
                        continue
                    }

                    if (selects.includes(variable)) {
                        element.selectpicker("val", opts[variable]).trigger("changed.bs.select")
                    } else if (checkboxes.includes(variable)) {
                        if (element.prop("checked") !== opts[variable]) // Still needs to be changed (could change if we already clicked on another button of the group)
                            element.trigger("click")
                    } else if (sliders.includes(variable)) {
                        element.slider("setValue", opts[variable]).slider("refresh", {useCurrentValue: true}).trigger("change")
                    } else if (text_areas.includes(variable)) {
                        this[variable] = opts[variable]
                        element.val(opts[variable])
                        if (element.hasClass("summernote")) {
                            element.html(opts[variable])
                            // To avoid simultaneous initialization of all the notes
                            if (!element[0].id.includes("note-") || element.parent().hasClass("show")) {
                                element.summernote("code", opts[variable])
                            }
                        } else {
                            element.val(opts[variable]).trigger("change")
                        }
                    } else {
                        if (numeric_inputs.includes(variable) && isNaN(parseInt(opts[variable]))) {
                            this.invalid_values[variable] = opts[variable]
                        } else {
                            element.val(opts[variable])
                            element.trigger("change")
                        }
                    }
                } else {
                    this[variable] = opts[variable]
                }
                continue
            }
            if (testing_sheet && updating_opts && opts && !(variable in opts)) {
                this.missing_data.push(variable)
            }
            if (updating_opts)
                continue // No need to fetch elements that were already fetched on page load

            // Get the element if it exists
            if (!element)
                element = this.get(variable)
            if (element.length === 0) {
                if (!this.missing_inputs.includes(variable))
                    this.missing_inputs.push(variable)
                continue
            }

            if (checkboxes.includes(variable)) {
                this[variable] = element.prop("checked")
            } else { // textarea need .val() because .html() escapes tags
                const is_slider = sliders.includes(variable)
                if (!is_slider)
                    this[variable] = element.val()
                else // Because the slider is not initialized yet and thus the value is empty
                    this[variable] = element.attr("data-slider-value")
                if (numeric_inputs.includes(variable) || is_slider) {
                    if (isNaN(this[variable])) {
                        this.invalid_values[variable] = this[variable]
                    }
                    this[variable] = parseInt(this[variable]) || 0
                }
                if (element.attr("data-max-options") === "1") // selectpicker multiple but not really
                    this[variable] = this[variable] && this[variable].length > 0 ? this[variable][0] : null
            }
        }

        // Check that all keys of opts were used
        if (updating_opts && typeof opts === 'object' && opts !== null) {
            for (const [key, value] of Object.entries(opts)) {
                if (!used_vars.includes(key) && !(["base_level", "row_number", "current_level"].includes(key))) {
                    this.unused_data[key] = value
                }
            }
        }
    }

    export() {
        let to_export = {}
        for (const [key, model] of Object.entries(this.models)) {
            to_export[key] = model.export()
        }
        const all_inputs = this.constructor.all_inputs()
        for (const variable of all_inputs) {
            to_export[variable] = this[variable]
        }

        const save_slider_min_max = this.constructor.suffix_inputs(this.constructor.save_slider_min_max)
        for (const slider of save_slider_min_max) {
            to_export[slider + ".min"] = this[slider + ".min"]
            to_export[slider + ".max"] = this[slider + ".max"]
        }

        const save_input_classes = this.constructor.suffix_inputs(this.constructor.save_input_classes)
        for (const [elem, class_names] of Object.entries(save_input_classes)) {
            for (const class_name of class_names) {
                const var_name = elem + "." + class_name
                to_export[var_name] = this[var_name]
            }
        }
        return to_export
    }
}

/**
 * @param x
 * @param y
 * @returns {boolean} true if both objects are equal (w.r.t. their content, not their memory location)
 */
function deepEqual(x, y) {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
        ok(x).length === ok(y).length &&
        ok(x).every(key => deepEqual(x[key], y[key]))
    ) : (x === y);
}
