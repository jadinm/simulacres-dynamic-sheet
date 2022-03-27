const realms = /mineral|vegetal|animal|nature|humanoid|mechanical|artificial|void|supernatural/

class RollRow extends DataRow {
    static requirements = [
        "biography", // Some ethnics have formula bonuses
        "characteristics", // For the formula
        "status", // The unease is needed in the formula
        ...TalentLists.talent_tables, // talents are required obviously
        "superpowers", // Superpowers boost the final value of rolls with the same component
        ...EquipmentRow.equipment_tables, // some rolls use equipments
    ]

    static radio_groups = {
        "component": Characteristics.components,
        "means": Characteristics.means,
        "realms": Characteristics.realms,
    }
    static v7_checkboxes = is_v7 ? ["details-exploding-effect"] : []
    static non_discovery_checkboxes = intermediate_discovery ? [] : ["details-include-armor-penalty"]
    static independent_checkboxes = [...this.v7_checkboxes, "details-equipment-always-expend", ...this.non_discovery_checkboxes]
    static selects = ["talent", "equipment"]
    static numeric_inputs = ["details-bonus", "details-equipment-always-expend-quantity"] // "details-max", "details-min" can be empty and thus, not in numeric inputs
    static basic_inputs = [...this.numeric_inputs, ...["effect", "details-name", "details-max", "details-min"]]

    // Get a variable in the scope of the div
    get_var(element_id_suffix, _div_or_prefix) {
        return this[element_id_suffix]
    }

    // Get default effect
    get_effect() {
        return this["effect"]
    }

    nbr_realms() {
        let nbr = 0
        for (const realm of Characteristics.realms) {
            if (this[realm]) { // checked
                nbr += 1
            }
        }
        return nbr
    }

    formula_elem(element, fixed_realm = null) {
        const formula_part = Characteristics[element[element.length-1] !== "s" ? element + "s" : element]

        // Discover checked realm/component/means (depending on element parameter)
        let checked_elem = ""
        if (element === "realm" && fixed_realm != null) {
            if (this[fixed_realm])
                checked_elem = fixed_realm
        } else {
            for (let i = 0; i < formula_part.length; i++) {
                if (this[formula_part[i]]) { // checked
                    checked_elem = formula_part[i]
                }
            }
        }
        if (checked_elem === "")
            return [0, null]  // Allow partial formulas

        // Compute bonus value (due to ethnics or superpowers)
        let bonus = 0
        if (checked_elem === "resistance" && sheet.biography.is_hobbit()) {
            bonus += 1 // Hobbits have an increased resistance
        }
        if (!(this instanceof SuperpowerRow) && element === "component") {
            // Superheroes have bonuses on all tests based on their component power
            const components = SuperpowerRollTable.components()
            if (components.includes(checked_elem))
                bonus += 4
        }
        return [bonus + sheet.characteristics[checked_elem], checked_elem]
    }

    compute_formula(fixed_realm = null) {
        const elements = ["component", "means", "realm"]
        let sum = 0
        const checked_elements = []
        for (let i = 0; i < elements.length; i++) {
            const ret = this.formula_elem(elements[i], fixed_realm)
            sum += ret[0]
            if (ret[1] !== null)
                checked_elements.push(ret[1])
        }
        return [sum, checked_elements]
    }

    cap_roll_value(sum) {
        // Optional min and max
        const min = parseInt(this["details-min"])
        if (!isNaN(min)) {
            if (isNaN(sum))
                sum = min
            else
                sum = Math.max(min, sum)
        }
        const max = parseInt(this["details-max"])
        if (!isNaN(max) && !isNaN(sum))
            sum = Math.min(max, sum)
        return sum
    }

    update_roll_value_hook(sum, dice_div) {
        return sum
    }

    update_roll_value(dice_div = $()) {
        dice_div = $(dice_div)
        dice_div = (dice_div.length > 0) ? dice_div : this.find(".row-roll-trigger")
        dice_div.each((i, dice_div) => {
            let sum = 0

            // Recover component, means and realm
            const formula = this.compute_formula()[0]
            sum += formula

            // Hardcoded bonus
            sum += this["details-bonus"]

            // Armor penalty if this is a physical action
            if (this["details-include-armor-penalty"])
                sum += sheet.status.get_armor_penalty()[0]

            // Add talent if any
            if (this["talent"]) {
                const talent = sheet.get_talent_from_name(this["talent"])
                if (talent) {
                    const level = talent.talent_level()
                    if (level === "x")
                        sum = "X"
                    else
                        sum += parseInt(level)
                }
            }

            sum = this.update_roll_value_hook(sum, dice_div)

            // Optional min and max
            sum = this.cap_roll_value(sum)

            // Unease is applied at the end
            if (!isNaN(sum))
                sum += sheet.status.get_unease()

            // Update
            this.get("value", dice_div).text(sum)
            this.get("dice", dice_div)[0].removeAttribute("hidden")
        })
    }

    uses_talent(talent) {
        return this["talent"] === talent.name
    }

    roll_reason() {
        const talent = this["talent"]
        const name = this["details-name"]
        let title = talent
        if (name) {
            title = name + (title ? " (" + title + ")" : "")
        }
        return title ? title : ""
    }

    roll(button) {
        // Find either spell difficulty or talent level to detect critical rolls
        let difficulty
        const formula_elements = this.compute_formula()[1]
        let margin_throttle = NaN
        if (this["talent"])
            difficulty = parseInt(sheet.get_talent_from_name(this["talent"]).talent_level())
        difficulty = isNaN(difficulty) ? 0 : difficulty

        // Equipment linked to the roll
        const equipment = this["equipment"] ? sheet.get_equipment(this["equipment"]) : null

        // Do the actual roll
        const value = parseInt(this.get("value", button).text())
        new TalentRoll(this.roll_reason(), value, difficulty, this.get_var("effect", button),
            this.get_critical_increase(button), formula_elements, margin_throttle, false, false,
            "", "", "", 0, "", "",
            equipment, this["details-equipment-always-expend"], this["details-equipment-always-expend-quantity"],
            this["details-include-armor-penalty"], this["details-exploding-effect"], "").trigger_roll()
    }

    get_critical_increase() {
        return 0
    }

    update_title() {
        let candidate_title = this["details-name"]
        candidate_title = candidate_title ? candidate_title : ""
        if (this["details-include-armor-penalty"])
            candidate_title += " (action physique)"

        const title_div = this.get("name")
        if (candidate_title != null && title_div.length > 0) {
            title_div.text(candidate_title)
            if (candidate_title.length > 0)
                title_div.removeClass("d-none")
            else
                title_div.addClass("d-none")
        }
    }

    formula_changed(e) {
        e.preventDefault()
        this.update_roll_value()
    }

    select_changed() {
        this.update_roll_value()
    }

    update_value() {
        this.update_roll_value()
    }

    view_details() {
        const formula = this.compute_formula()[1]
        let title = "<h2>" + this.roll_reason() + "</h2>"
        if (formula.length > 0) {
            title += "<h4>"
            for (let i = 0; i < formula.length; i++) {
                const symbol = Characteristics.build_svg_image(formula[i])
                if (symbol.length > 0) {
                    title += symbol
                    if (i !== formula.length - 1)
                        title += "&nbsp;+&nbsp;"
                }
            }
            title += "</h4>"
        }
        this.get("details-title").html(title)
        let text = ""
        if (this["time"])
            text += "Concentration: " + this["time"] + "<br/>"
        if (this["distance"])
            text += "Portée: " + this["distance"] + "<br/>"
        if (this["duration"])
            text += "Durée: " + this["duration"] + "<br/>"
        const effect = this.get_effect()
        if (effect)
            text += "Effet: " + effect
        this.get("details-effect").html(text)
        this.get("details").modal()
    }

    add_listeners() {
        super.add_listeners()

        if (!this.is_template()) {
            this.find(".row-roll-trigger").on("click", e => this.roll(this.button_from_event(e)))
            const formulas = this.find(".formula-elem").on("change", e => this.formula_changed(e))
            this.find("select").on("changed.bs.select", () => this.select_changed())
            const show_details = this.get("show-details").on("click", () => this.view_details())
            this.get("details-bonus").on("change", () => this.update_value())
            this.get("details-min").on("change", () => this.update_value())
            this.get("details-max").on("change", () => this.update_value())
            this.get("details-name").on("change", () => this.update_title())
            this.get("details-include-armor-penalty").on("click", () => {
                this.update_roll_value()
                this.update_title()
            })
            if (this.dom_created) { // Only executed when the row is freshly created because tooltips are initialized on load
                formulas.next().tooltip() // add the tooltip for the label
                this.get("copy").tooltip()
                show_details.tooltip()
                this.update_title()
            }
        }
    }
}

class DualWieldingRow extends RollRow {
    static selects = ["talent", "tap-talent", "equipment"]

    uses_talent(talent) {
        return this["talent"] === talent.name || this["tap-talent"] === talent.name
    }

    get_critical_increase() {
        // Dual wielding increases critical chance
        return super.get_critical_increase() + ((this["tap-talent"]) ? 1 : 0)
    }

    update_roll_value_hook(sum, dice_div) {
        // Dual wielding: check tap talent level for penalty
        let tap_talent = this["tap-talent"]
        if (tap_talent) {
            tap_talent = sheet.get_talent_from_name(tap_talent)
            if (!tap_talent)
                sum = "X"
            else {
                const level = tap_talent.talent_level()
                if (level === "x")
                    sum = "X"
                else // Fixed penalty of using dual wielding
                    sum += Math.min(parseInt(level) - 2, 0)
            }
        }
        return sum
    }

    roll_reason() {
        const talent = this["talent"]
        const tap_talent = this["tap-talent"]
        const name = this["details-name"]
        let title = talent
        if (tap_talent) {
            title = "Combat à deux armes: " + talent + " & " + tap_talent
        }
        if (name) {
            title = name + (title ? " (" + title + ")" : "")
        }
        return title ? title : ""
    }
}

const range_list = ["point_blank", "normal", "slightly_far", "very_far"]
const ranges = /point_blank|normal|slightly_far|very_far/

class RangeRow extends RollRow {
    static basic_inputs = [...this.numeric_inputs,
        ...[...(is_v7 ? ["distance"] : []), "effect", "details-name", "details-max", "details-min"]]
    static duplicated_inputs = is_v7 ? {
        "effect": range_list,
        "distance": range_list,
    } : {}

    static modifier_by_range = {
        point_blank: 0,
        normal: 0,
        slightly_far: -2,
        very_far: -4
    }

    static column_shift_by_range = {
        point_blank: 2,
        normal: 0,
        slightly_far: -1,
        very_far: -2
    }

    range(range_div) {
        const range_split = $(range_div)[0].id.split("-")
        const range = range_split[range_split.length - 1]
        return range.match(ranges) ? range : ""
    }

    get(element_id_suffix, range_div = null) {
        let elem = super.get(element_id_suffix)
        if (elem.length === 0 && range_div)
            elem = super.get(element_id_suffix + "-" + this.range(range_div))
        return elem
    }

    get_var(element_id_suffix, div_or_prefix = null) {
        if (!is_v7)
            return super.get_var(element_id_suffix, div_or_prefix)
        if (typeof div_or_prefix === "string")
            return this[element_id_suffix + "-" + div_or_prefix]
        const range = div_or_prefix ? this.range(div_or_prefix) : "normal"
        return this[element_id_suffix + "-" + range]
    }

    get_effect() {
        return is_v7 ? this["effect-normal"] : super.get_effect()
    }

    update_roll_value_hook(sum, dice_div) {
        const range = this.range(dice_div)
        if (range === "" || isNaN(sum))
            return sum
        return sum + this.constructor.modifier_by_range[range]
    }

    column_shift(column, modifier, shift) {
        const columns = Object.keys(effect_table).sort()
        const column_index = columns.indexOf(column)
        let remaining_shift = 0
        if (column_index !== -1) {
            if (shift >= 0) {
                remaining_shift = column_index + shift - columns.length + 1
                remaining_shift = remaining_shift <= 0 ? 0 : remaining_shift
                column = columns[column_index + shift - remaining_shift]
            } else {
                remaining_shift = column_index + shift
                remaining_shift = remaining_shift >= 0 ? 0 : remaining_shift
                column = columns[column_index + shift - remaining_shift]
            }
        }
        modifier = modifier + remaining_shift
        if (modifier > 0)
            return column + "+" + modifier
        else if (modifier < 0)
            return column + modifier
        else
            return column
    }

    update_effects() {
        if (!is_v7)
            return
        const base_effect = this["effect-normal"]
        this.find("span.roll-effect").each((i, elem) => {
            if (!base_effect || base_effect.length === 0) {
                $(elem).html("&nbsp;")
            } else {
                const range = this.range(elem)
                const text = base_effect.replaceAll(effect_column_regex, (match, prefix, escape, column, modifier, escape2, suffix) => {
                    modifier = typeof modifier === "undefined" ? 0 : parseInt(modifier.replaceAll(" ", ""))
                    escape = typeof escape === "undefined" ? "" : escape
                    escape2 = typeof escape2 === "undefined" ? "" : escape2
                    const new_effect = this.column_shift(column, modifier,
                        this.constructor.column_shift_by_range[range])
                    return prefix + "["  + escape + new_effect + escape2 + "]" + suffix
                })
                $(elem).text(text)
                $(elem).prev().val(text).trigger("change")
            }
        })
    }

    add_listeners() {
        super.add_listeners()

        if (!this.is_template())
            this.get(is_v7 ? "effect-normal" : "effect").on("change", () => this.update_effects())
    }
}

class TalentRollTable extends DataList {
    static row_class = RollRow

    clone_row() {
        // We don't copy listeners because it does not work with select pickers and sliders
        return this.template_row.data.clone(true, false)
    }
}

class CloseCombatRollTable extends TalentRollTable {
    static checked_radio = ["body", "action"]
    static disabled_radio = [...Characteristics.means, ...Characteristics.components]

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)

        for (let radio of this.constructor.checked_radio) {
            check_radio(row.get(radio)[0])
            row[radio] = true
        }
        for (let radio of this.constructor.disabled_radio) {
            row.get(radio).attr("disabled", "disabled")
        }
        row.update_roll_value()
    }
}

class RangeCombatRollTable extends CloseCombatRollTable {
    static row_class = RangeRow
    static checked_radio = ["body", "perception"]
}

class DualWieldingRollTable extends CloseCombatRollTable {
    static row_class = DualWieldingRow
    static checked_radio = ["body", "action", (is_v7 ? "mechanical" : "artificial")]
    static disabled_radio = [...Characteristics.means, ...Characteristics.components, ...Characteristics.realms]
}

/* Triggers */

$("#roll-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#dual_wielding-table tr,#close_combat-table tr,#range_combat-table tr,#roll-table tr"))
})
