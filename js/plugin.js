class PluginModel extends Model {
    static requirements = [] // Don't hesitate to use this to force the plugin initialization after a given model
    static id = "plugin" // The plugin id, that prefixes every input, text area or select picker

    static additional_magical_energy = [] // If the plugin inserts a new energy, add it there and do not add it in basic_inputs or numeric_inputs
    static additional_talents = {} // Additional talents that the plugin will add if not already present

    constructor(opts, other_html = null, prepare_arg = null) {
        super(opts, other_html, prepare_arg)
    }

    /**
     * @param {string} base_id
     * @returns {string} the full id, as shown in the HTML
     */
    full_id(base_id) {
        return "plugin-" + this.constructor.id + "-" + base_id
    }

    /**
     * @param {string} full_id the full id, as shown in the HTML
     * @returns {string} the local id, without the plugin prefix
     */
    local_id(full_id) {
        return full_id.replace("plugin-" + this.constructor.id + "-", "")
    }

    /**
     * @param {jQuery} plugin_html The blocks of html
     * @returns {null|string} the version number
     */
    static get_plugin_version(plugin_html) {
        let version = null
        $(plugin_html).children().each((i, elem) => {
            const attr = elem.getAttribute("data-plugin-version")
            if (attr)
                version = attr
        })
        return version
    }

    /**
     * @param {string} version_a
     * @param {string} version_b
     * @returns {boolean} whether version_a is older than version_b
     */
    static is_older_than(version_a, version_b) {
        if (!version_a)
            return true
        if (!version_b)
            return false
        if (version_a === version_b)
            return false
        const split_a = version_a.split(".")
        const split_b = version_b.split(".")
        for (let i = 0; i < split_a.length && i < split_b.length; i++) {
            const part_a = parseInt(split_a[i])
            const part_b = parseInt(split_b[i])
            if (part_a > part_b)
                return false
            if (part_a < part_b)
                return true
        }
        // This is a new version only if b has a more specified version
        // e.g., a == "1.0" and b == "1.0.1"
        return split_a.length < split_b.length
    }

    /**
     * Registers the plugin to sheet
     * It has to be called right after the plugin class declaration
     */
    static load() {
        sheet_type.plugin_names["plugin-" + this.id] = this
        if (this.additional_magical_energy.length > 0) {
            Characteristics.reload_energies()
        }
        if (sheet) { // Note: doing the install process means that we do not support dependencies between plugins
            TalentLists.add_missing_talents(this.additional_talents)
            if (this.additional_magical_energy.length > 0) {
                delete sheet["characteristics"] // re-build characteristics
            }
            if (sheet["plugin-" + this.id])
                this.upgrade()
            else
                this.install()
        }
    }

    /**
     * Without this, mdbootstrap does not realize that there is a value in the input and the label overlaps with the value
     */
    static prevent_overlap() {
        const plugin = sheet["plugin-" + this.id]
        const inputs = [...this.basic_inputs, ...this.additional_magical_energy]
        inputs.forEach((input) => {
            plugin.get(input).trigger("change")
        })
    }

    /**
     * Called when the plugin is inserted for the first time
     */
    static install() {
        sheet.build() // build the missing plugins

        this.prevent_overlap() // mdbootstrap fix
    }

    /**
     * Called when the plugin is upgraded for the first time
     */
    static upgrade() {
        delete sheet["plugin-" + this.id]
        delete sheet.opts["plugin-" + this.id]
        sheet_type.plugin_names["plugin-" + this.id] = this
        sheet.build() // re-build the plugin (note that the plugin will re-read everything himself)

        this.prevent_overlap() // mdbootstrap fix
    }

    /**
     * Called when the plugin is removed
     */
    remove() {
        delete sheet_type.plugin_names["plugin-" + this.constructor.id]
        if (sheet)
            delete sheet["plugin-" + this.constructor.id]

        if (this.constructor.additional_magical_energy.length > 0) {
            Characteristics.reload_energies() // Energies not in the static variables won't get exported
            $("select.spell-list").each((i, input) => {
                init_spell_list(input, true)
            })
            update_numeric_input_select(this.find("select.special-energy-select"), this.find(".special-energy"))
            compute_remaining_ap()
        }
    }
}
