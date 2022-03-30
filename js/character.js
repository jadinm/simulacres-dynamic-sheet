let sheet = null
let sheet_loaded = false

class Biography extends Model {
    static numeric_inputs = [...(intermediate_discovery ? [] : ["luck-points"]), "age", "height", "weight"]
    static basic_inputs = [...this.numeric_inputs, ...["character-name", "race", "gender", "work"]]

    static hobbit_regexes = [/[Hh]obbits?/, /[Tt]inigens?/, /[Pp]etites [Gg]ens/, /[Pp]etites? [Pp]ersonnes?/,
        /[Tt]omt[eé]s?/]

    is_hobbit() {
        if (this.race || this.race.length === 0)
            return false
        for (let i in this.constructor.hobbit_regexes) {
            if (this.race.match(this.constructor.hobbit_regexes[i]) != null)
                return true
        }
        return false
    }

    add_listeners() {
        super.add_listeners()

        // Update the title when the character name changes
        this.get("character-name").on("change", e => {
            const value = e.target.value
            if (value && value.length > 0) {
                sheet.save_local_storage()
                document.title = value
            } else {
                document.title = "SimulacreS"
            }
        })
    }
}

class Money extends Model {
    static numeric_inputs = universe === med_fantasy ? ["copper-coins", "silver-coins", "gold-coins"]
        : (universe === captain_voodoo ? ["peso-de-ocho"] : [])
    static text_inputs = universe === med_fantasy ? ["copper-currency", "silver-currency", "gold-currency"]
        : (universe === captain_voodoo ? ["copper-currency"] : ["money"])
    static basic_inputs = [...this.numeric_inputs, ...this.text_inputs]
}

class Character {

    static model_names = { // direct sub-models
        "ap": (discovery ? AdventurePoints : (is_v7 ? AdventurePointsV7 : AdventurePointsV8)),
        "background": Background,
        "biography": Biography,
        "characteristics": Characteristics,
        "status": (localized_hp ? LocalizedStatus : UnlocalizeStatus),
        "money": Money,
    }

    static table_names = { // tables containing rows of models
        "focuses": [FocusTable, "focus-table"],
        "magical_equipment": [MagicalEquipmentTable, "magical-equipment-table"],
        "equipment": [RegularEquipmentTable, "equipment-table"],
        "limited_equipment": [LimitedUseEquipmentTable, "limitedUse-equipment-table"],

        "notes": [NoteTable, "note-table"],

        "runes": [RuneTable, "rune-table"],
        "words": [WordTable, "word-table"],

        // Talents
        "talents_x": [TalentLists, "talents_x"],
        "talents_-4": [TalentLists, "talents_-4"],
        "talents_-2": [TalentLists, "talents_-2"],
        "talents_0": [TalentLists, "talents_0"],
        "talents_1": [TalentLists, "talents_1"],
        "talents_2": [TalentLists, "talents_2"],
        "talents_3": [TalentLists, "talents_3"],

        // Talent rolls
        "rolls": [TalentRollTable, "roll-table"],
        "dual_wielding": [DualWieldingRollTable, "dual_wielding-table"],
        "close_combat": [CloseCombatRollTable, "close_combat-table"],
        "range_combat": [RangeCombatRollTable, "range_combat-table"],

        // Magic tables
        "spells": [SpellRollTable, "spell-table"],
        "focus_spells": [FocusMagicRollTable, "focusMagic-table"],

        // Other powers
        "psi_powers": [PsiRollTable, "psi-table"],
        "ki_powers": [KiTable, "ki-table"],
        "warrior_way": [WarriorRollTable, "warrior-table"],
        "superpowers": [SuperpowerRollTable, "superpower-table"],
    }

    static plugin_names = {}

    static talent_based_rolls = [
        "rolls", "dual_wielding", "close_combat", "range_combat", "spells", "focus_spells", "ki_powers"
    ]

    static all_roll_tables = [
        ...this.talent_based_rolls, "superpowers", "psi_powers", "warrior_way"
    ]

    static ignore_ids_list = ["roll-dialog-.+", ".+-search", "roll-free-number", "roll-threshold",
        "import-page", "import-plugin", "import-image", "import-background-image",
        "backColorPicker", "foreColorPicker", "note-dialog-.+"]

    /**
     * @param other_html Another source than the current document
     */
    constructor(other_html = null) {
        this.other_html = other_html
        const saved_data = this.get("saved-data")

        if (saved_data.length === 0)
            this.opts = {}
        else
            this.opts = JSON5.parse(saved_data.text().trim())

        this.duplicated_ids = []
        this.unhandled_id = []
        this.dependency_issues = []
        this.all_errors = {}

        this.ignore_ids_regex = new RegExp("(" + this.constructor.ignore_ids_list.join(")|(") + ")")

        this.version = null
        if (this.opts && this.opts.version)
            this.version = this.opts.version

        this.storage_id = null

        if (this.other_html == null) {
            window.setInterval(() => {
                this.save()
            }, 5000) // save every 5 seconds
        }
    }

    resolve_dependencies() {
        // Build dependency graph
        this.dependency_graph = new Graph()
        for (const [key, desc] of [...Object.entries(this.constructor.model_names), ...Object.entries(this.constructor.table_names), ...Object.entries(this.constructor.plugin_names)]) {
            const type = Array.isArray(desc) ? desc[0].row_class : desc
            this.dependency_graph.add(key, type.requirements)
        }
        // Talent lists have dependencies with each other
        if (!npc_grid) {
            this.dependency_graph.add("talents_-4", ["talents_x"])
            this.dependency_graph.add("talents_-2", ["talents_x", "talents_-4"])
            this.dependency_graph.add("talents_0", ["talents_x", "talents_-4", "talents_-2"])
            this.dependency_graph.add("talents_1", ["talents_x", "talents_-4", "talents_-2", "talents_0"])
            this.dependency_graph.add("talents_2", ["talents_x", "talents_-4", "talents_-2", "talents_0", "talents_1"])
            this.dependency_graph.add("talents_3", ["talents_x", "talents_-4", "talents_-2", "talents_0", "talents_1", "talents_2"])
        }
        logger.debug("Dependency graph:\n" + this.dependency_graph.toDot())

        // Detect potential cycles
        this.dependency_issues = this.dependency_graph.getCycleErrors()
        for (const error of this.dependency_issues) {
            logger.error("Dependency issue:", error)
        }
    }

    bfs_dependencies() {
        const init_order = []
        this.dependency_graph.bfs_in_disjoint_graph((vertex) => {
            const desc = vertex.name
            init_order.push([desc, desc in this.constructor.model_names
                ? this.constructor.model_names[desc]
                : desc in this.constructor.table_names ? this.constructor.table_names[desc] : this.constructor.plugin_names[desc]])
        })
        return init_order
    }

    build() {
        const opts = this.opts
        this.resolve_dependencies()

        // Initialize spell lists on the first load
        if (Object.keys(opts).length === 0) {
            $("select.spell-list").each((i, input) => {
                init_spell_list(input)
            })
        }

        // Resolve dependencies and build all the models and tables
        this.bfs_dependencies().forEach((descriptor) => {
            const [model_var, model_class_desc] = descriptor
            if (model_var in this)
                return // Already built (useful when inserting plugins dynamically)
            if (Array.isArray(model_class_desc)) { // is a table descriptor
                this[model_var] = new model_class_desc[0](this.get(model_class_desc[1]), opts[model_var], this.other_html)
            } else {
                this[model_var] = new model_class_desc(opts[model_var], this.other_html)
            }
        })

        // Useful for development but will not impact users loading their character sheet
        // However, dependency issues, potentially due to plugins should always be displayed
        if (Object.keys(opts).length === 0 || this.dependency_issues.length > 0 || debug)
            this.sanity_check()
    }

    /**
     * Direct models and the models of the tables are listed as [identifier_model_instance, model]
     * @param include_templates whether we need to look at the template rows
     */
    list_models(include_templates = false) {
        const models = []
        for (const [model_var, _] of [...Object.entries(this.constructor.model_names), ...Object.entries(this.constructor.plugin_names)]) {
            models.push([model_var, this[model_var]])
        }
        for (const [table_var, _] of Object.entries(this.constructor.table_names)) {
            for (let row of this[table_var].get_rows(include_templates)) {
                models.push([row.id, row])
            }
        }
        return models
    }

    /**
     * Returns a list of [variable_name, model_or_table]
     */
    list_variables(in_dependency_order = false) {
        const models = []
        const model_desc = in_dependency_order ? this.bfs_dependencies() : [...Object.entries(this.constructor.model_names), ...Object.entries(this.constructor.table_names), ...Object.entries(this.constructor.plugin_names)]
        for (let [variable, _] of model_desc)
            models.push([variable, this[variable]])
        return models
    }

    talent_lists() {
        return TalentLists.talent_tables.map((elem) => this[elem]).filter((elem) => typeof elem !== "undefined")
    }

    find(selector) {
        return this.other_html !== null ? this.other_html.find(selector) : $(selector)
    }

    get(id) {
        return this.find("#" + id)
    }

    sanity_check() {
        // Clean old errors
        this.clean_errors()

        const startTime = performance.now()
        const all_inputs = {}
        $("select[id],input[id],textarea[id]").sort((a, b) => {
            if (a.id === b.id)
                return 0
            return a.id < b.id ? -1 : 1
        }).each((i, elem) => {
            const id = elem.id
            if (Object.keys(all_inputs).includes(id)) {
                logger.error("[ERROR] Two inputs with the same id:", id)
                this.duplicated_ids.push(id)
            } else {
                all_inputs[id] = $(elem)
            }

            if (id.match(this.ignore_ids_regex))
                return // Not a relevant input

            for (const [_, model] of this.list_models(true)) {
                if (model.has(id))
                    return // Handled by this model
            }

            // Variable not found
            logger.error("Input", id, "is not handled by any model")
            this.unhandled_id.push(id)
        })

        // Check for some errors
        for (let [_, model] of this.list_models(true)) {
            model.sanity_check(all_inputs)
        }

        const endTime = performance.now()
        logger.info(`Checking the page validity took ${endTime - startTime} milliseconds`)
    }

    clean_errors() {
        this.duplicated_ids = []
        this.unhandled_id = []
    }

    has_errors() {
        for (let [_, model] of this.list_models(true)) {
            if (model.has_errors())
                return true
        }

        return this.duplicated_ids.length > 0 || this.unhandled_id.length > 0 || this.dependency_issues.length > 0
    }

    get_missing_inputs() {
        const errors = {}
        for (const [model_id, model] of this.list_models(true)) {
            errors[model_id] = model.missing_inputs
        }
        return errors
    }

    /**
     * Show the modal with sheet warnings
     */
    build_error_summary(reason) {
        $("#import-warning-title").text(reason)

        // Recover lists of errors inputs
        const error_types = {
            dependency_issues: $("#import-warning-dependencies"),
            duplicated_ids: $("#import-warning-duplicated"),
            unhandled_id: $("#import-warning-unhandled"),
            missing_inputs: $("#import-warning-missing"),
            invalid_values: $("#import-warning-invalid"),
            unsync_values: $("#import-warning-unsync"),
        }
        this.all_errors = {}

        for (const [variable, list] of Object.entries(error_types)) {
            // Extract errors
            this.all_errors[variable] = []
            let list_errors = {}
            if (variable in this)
                list_errors["fiche"] = this[variable]

            for (const [model_id, model] of this.list_models(true)) {
                if (variable in model)
                    list_errors[model_id] = model[variable]
                for (const [key, sub_model] of Object.entries(model.models)) {
                    if (variable in sub_model)
                        list_errors[model_id + "." + key] = sub_model[variable]
                }
            }

            // Overwrite the dialog
            list.empty()
            const base_elem = $("<li class=\"list-group-item align-items-center py-1 my-0\"></li>")
            for (const [scope, errors] of Object.entries(list_errors)) {
                if (Array.isArray(errors)) {
                    for (const error of errors) {
                        const elem = base_elem.clone(false, false)
                        const error_text = "[" + scope + "] " + error
                        this.all_errors[variable].push(error_text)
                        elem.text(error_text)
                        list.append(elem)
                    }
                } else {
                    for (const [error_var, [actual, expected]] of Object.entries(errors)) {
                        const elem = base_elem.clone(false, false)
                        const error_text = "[" + scope + "] " + error_var + " has value " + JSON5.stringify(actual) + " instead of " + JSON5.stringify(expected)
                        this.all_errors[variable].push(error_text)
                        elem.text(error_text)
                        list.append(elem)
                    }
                }
            }
        }

        // Show the modal
        $("#import-warning").modal()
    }

    build_loading_error_summary() {
        this.build_error_summary("Problème au démarrage")
    }

    build_import_error_summary() {
        this.build_error_summary("Problème à l'importation")
    }

    // If an id can be inferred, return it
    local_storage_id() {
        if (this["biography"]) {
            const id = this["biography"]["character-name"]
            if (id)
                return id + ".sheet.json"
            return null
        }
        return null
    }

    import_local_storage() {
        this.storage_id = this.local_storage_id()
        if (this.storage_id == null) // No id available
            return
        const storage = localStorage.getItem(this.storage_id)
        if (!storage)
            return
        const data = JSON5.parse(storage)
        // Compare to localStorage version (a new page won't have data imported because it does not have version fields)
        this.import(data)
    }

    import(opts, allow_downgrade = false) {
        if (opts && opts.version) {
            if (this.version >= opts.version && !allow_downgrade) {
                logger.info("The data are not imported because the version is the same or it would downgrade the data version")
                return
            }
            logger.info("Importing data from version", opts.version, "into sheet in version", this.version)
            this.version = opts.version
        }
        for (let [model_var, model] of this.list_variables(true)) {
            if (model_var !== "ap") // Update AP model last
                model.import(opts[model_var], opts)
        }

        // Update AP model last because it might select spells or talents not existing in the middle
        this["ap"].import(opts["ap"], opts)

        if (debug)
            this.sanity_check()
    }

    export() {
        const exported_data = {version: this.version}
        for (let [model_var, model] of this.list_variables()) {
            exported_data[model_var] = model.export()
        }
        return exported_data
    }

    save_local_storage(data = null) {
        if (!changed_page || exported2LocalStorage)
            return // Do not update local storage if not needed

        const current_storage_id = this.local_storage_id()
        if (current_storage_id == null)
            return

        // Move current data
        if (data == null && this.storage_id != null && this.storage_id !== current_storage_id) {
            data = localStorage.getItem(this.storage_id)
            localStorage.removeItem(this.storage_id)
            this.storage_id = current_storage_id
        }

        // Save data
        localStorage.setItem(current_storage_id, data)
        exported2LocalStorage = true
    }

    // Save metadata to html page for quick load
    save() {
        this.version = Math.round(Date.now() / 1000)
        const exported_data = this.export()
        const base_version = this.opts.version
        this.opts.version = exported_data.version
        const data = JSON5.stringify(exported_data, null, 4)
        if (JSON5.stringify(this.opts, null, 4) !== data) { // Update
            this.save_local_storage(data)
            this.get("saved-data").text(data)
            this.opts = exported_data
        } else {
            this.opts.version = base_version
        }
    }

    equipments() {
        const equipments = []
        for (const table of EquipmentRow.equipment_tables) {
            for (const row of this[table].get_rows()) {
                equipments.push(row)
            }
        }
        return equipments
    }

    get_equipment(equipment_id) {
        for (const table of EquipmentRow.equipment_tables) {
            for (const row of this[table].get_rows()) {
                if (row.id === equipment_id)
                    return row
            }
        }
        return null
    }

    get_talent_list(list_id) {
        return this.talent_lists().filter(elem => elem.id === list_id)[0]
    }

    /**
     * Get the list of all rolls that uses the Talent object in argument
     * @param talent
     */
    get_all_rolls_with_talent(talent) {
        return this.constructor.all_roll_tables.filter((elem) => this[elem]).map((elem) => this[elem].get_rows().filter((row) => {
            return row.uses_talent(talent)
        })).flat()
    }

    /**
     * Returns the list of rows whose formula element is checked
     * @param formula_part e.g., body, animal, perception
     */
    get_all_rolls_with_formula_part(formula_part) {
        return this.constructor.all_roll_tables.filter((elem) => this[elem]).map((elem) => this[elem].get_rows().filter((row) => !formula_part || row[formula_part])).flat()
    }

    /**
     * @returns rolls that are marked as physical
     */
    get_physical_rolls() {
        return this.constructor.all_roll_tables.filter((elem) => this[elem]).map((elem) => this[elem].get_rows().filter((row) => row["details-include-armor-penalty"])).flat()
    }

    /**
     * Get the list of all rolls
     */
    get_all_rolls() {
        return this.constructor.all_roll_tables.filter((elem) => this[elem]).map((elem) => this[elem].get_rows()).flat()
    }

    get_talent_from_name(name) {
        const res = this.talent_lists().map((list) => {
            const talent = list.get_talent_from_name(name)
            return talent != null ? [talent] : []
        }).flat()
        if (res.length === 0)
            return null
        return res[0]
    }

    get_talent_from_id(id) {
        const res = this.talent_lists().map((list) => list.get_rows().filter((talent) => talent.id === id)).flat()
        if (res.length === 0)
            return null
        return res[0]
    }

    talents(include_template_row = false) {
        return this.talent_lists().map((list) => {
            return list.get_rows(include_template_row)
        }).flat()
    }

    get_status() {
        return this["status"]
    }
}

class NPCGridSheet extends Character {
    static model_names = {}
    static table_names = {
        // NPC grid
        "npc_grid": [NPCGrid, "npc-table"],
    }
    static ignore_ids_list = [...super.ignore_ids_list, "import-bestiary", "npc-table-add-select", "bestiary"]

    get_status(row_index) {
        return this.npc_grid.get_row(row_index).models.status
    }

    is_hobbit() {
        return false
    }
}

const sheet_type = npc_grid ? NPCGridSheet : Character

const startTime = performance.now()

$(() => {
    if (npc_grid) {
        sheet = new NPCGridSheet()
    } else {
        sheet = new Character()
    }
    sheet.build()
    sheet.import_local_storage()

    // Initialize AP computation
    if (!npc_grid) {
        compute_remaining_ap()
    }

    if (sheet.has_errors())
        sheet.build_loading_error_summary()
    sheet_loaded = true

    const endTime = performance.now()
    logger.info(`Loading the page took ${endTime - startTime} milliseconds`)
})
