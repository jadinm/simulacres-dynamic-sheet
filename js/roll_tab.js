realms = /mineral|vegetal|animal|nature|humanoid|mechanical|artificial|void|supernatural/

class RollRow extends DataRow {

    formula_elem(element, fixed_realm = null) {
        const elem_name = this.id + "-" + element
        let checked_elem = $("input[name=" + elem_name + "]:checked")
        if (element === "realm" && fixed_realm != null)
            checked_elem = checked_elem.filter("[id*=\"-" + fixed_realm + "\"]")
        if (checked_elem.length === 0)
            return [0, $()]  // Allow partial formulas
        const base_array = checked_elem[0].id.split("-")
        const formula_base_name = base_array[base_array.length - 1]
        let bonus = 0
        if (formula_base_name === "resistance" && is_hobbit()) {
            bonus += 1 // Hobbits have an increased resistance
        }
        if (!(this instanceof SuperpowerRow)) {
            const components = SuperpowerRollTable.components()
            if (components.includes(formula_base_name))
                bonus += 4 // Super heroes have bonuses on all tests based on their component power
        }
        return [bonus + parseInt($("#" + formula_base_name).val()), checked_elem]
    }

    compute_formula(fixed_realm = null) {
        const elements = ["component", "means", "realm"]
        let sum = 0
        const checked_elements = []
        for (let i = 0; i < elements.length; i++) {
            const ret = this.formula_elem(elements[i], fixed_realm)
            sum += ret[0]
            if (ret[1].length > 0)
                checked_elements.push(ret[1])
        }
        return [sum, checked_elements]
    }

    cap_roll_value(sum) {
        // Optional min and max
        const min = parseInt(this.get("details-min").val())
        if (!isNaN(min)) {
            if (isNaN(sum))
                sum = min
            else
                sum = Math.max(min, sum)
        }
        const max = parseInt(this.get("details-max").val())
        if (!isNaN(max) && !isNaN(sum))
            sum = Math.min(max, sum)
        return sum
    }

    update_roll_value_hook(sum, dice_div) {
        return sum
    }

    update_roll_value(dice_div = $()) {
        dice_div = $(dice_div)
        dice_div = (dice_div.length > 0) ? dice_div : this.data.find(".row-roll-trigger")
        dice_div.each((i, dice_div) => {
            let sum = 0

            // Recover component, means and realm
            const formula = this.compute_formula()[0]
            sum += formula

            // Add talent if any
            let talent = this.get("talent", dice_div)
            if (talent.length === 0)
                return
            talent = talent.val()

            const bonus = this.get("details-bonus", dice_div)
            if (bonus.length > 0 && !isNaN(parseInt(bonus.val()))) {
                sum += parseInt(bonus.val())
            }

            const talent_div = talent_from_name(talent)
            if (talent.length !== 0 && talent_div.length !== 0) {
                const level = talent_level(talent_div[0])
                if (level === "x")
                    sum = "X"
                else
                    sum += parseInt(level)
            }

            // Dual wielding: check tap talent level for penalty
            let tap_talent = this.get("tap-talent", dice_div)
            tap_talent = tap_talent.val()
            if (tap_talent) {
                const tap_talent_div = talent_from_name(tap_talent)
                if (tap_talent_div.length === 0)
                    sum = "X"
                else {
                    const level = talent_level(tap_talent_div[0])
                    if (level === "x")
                        sum = "X"
                    else // Fixed penalty of using dual wielding
                        sum += Math.min(parseInt(level) - 2, 0)
                }
            }

            sum = this.update_roll_value_hook(sum, dice_div)

            // Optional min and max
            sum = this.cap_roll_value(sum)

            // Unease is applied at the end
            if (!isNaN(sum))
                sum += get_unease()

            // Update
            this.get("value", dice_div).text(sum)
            this.get("dice", dice_div)[0].removeAttribute("hidden")
        })
    }

    roll_reason() {
        const talent = this.get("talent").find("option:selected").val()
        const tap_talent_select = this.get("tap-talent")
        const name = this.get("name").text()
        let title = talent
        if (tap_talent_select.length > 0) {
            const tap_talent = tap_talent_select.find("option:selected").val()
            title = "Combat à deux armes: " + talent + " & " + tap_talent
        }
        if (name.length > 0) {
            title = name + ((title.length > 0) ? " (" + title + ")" : "")
        }
        return title
    }

    roll(button) {
        // Find either spell difficulty or talent level to detect critical rolls
        let difficulty
        let critical_increase = 0
        const formula_elements = this.compute_formula()[1]
        let margin_throttle = NaN
        const talent_select = this.get("talent", button)
        const talent = talent_select.find("option:selected").val()
        difficulty = parseInt(talent_level(talent_from_name(talent)))

        // Dual wielding
        const tap_talent_select = this.get("tap-talent", button)
        if (tap_talent_select.length > 0) {
            critical_increase += 1
        }
        difficulty = isNaN(difficulty) ? 0 : difficulty

        // Equipment linked to the roll
        const equipment_id = this.get("equipment").val()
        const equipment = (equipment_id && equipment_id.length > 0) ? row_of($("#" + this.get("equipment").val())).get("name").val() : ""

        const exploding_effect = this.get("details-exploding-effect").prop("checked")

        // Do the actual roll
        const value = parseInt(this.get("value", button).text())
        new TalentRoll(this.roll_reason(), value, difficulty, this.get("effect", button).val(),
            critical_increase, formula_elements, margin_throttle, false, false,
            "", "", "", 0, "", "",
            equipment, equipment_id, exploding_effect, "").trigger_roll()
    }

    update_title() {
        const candidate_title = this.get("details-name").val()
        const title_div = this.get("name")
        if (candidate_title != null && title_div.length > 0) {
            title_div.text(candidate_title)
            if (candidate_title.length > 0)
                title_div.removeClass("d-none")
            else
                title_div.addClass("d-none")
        }
    }
}

ranges = /point_blank|normal|slightly_far|very_far/

class RangeRow extends RollRow {
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
        const base_effect_div = this.get("effect-normal")
        if (base_effect_div.length === 0)
            return // Version 8
        const base_effect = base_effect_div.val()
        this.data.find(".roll-effect").filter((i, elem) => {
            return elem.id !== base_effect_div[0].id
        }).each((i, elem) => {
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
                $(elem).prev().val(text)
            }
        })
    }
}

class TalentRollTable extends DataTable {
    static row_class = RollRow

    trigger_roll(event) {
        // Find the real target of the click
        let button = $(event.target)
        if (!button.hasClass("row-roll-trigger"))
            button = $(event.target).parents(".row-roll-trigger")
        row_of(button).roll(button)
    }

    formula_changed(e) {
        e.preventDefault()
        row_of(e.target).update_roll_value()
    }

    select_changed(e) {
        row_of(e.target).update_roll_value()
    }

    view_details(_) {
        const row = row_of(this)
        const formula = row.compute_formula()[1]
        let title = "<h2>" + row.roll_reason() + "</h2>"
        if (formula.length > 0) {
            title += "<h4>"
            for (let i = 0; i < formula.length; i++) {
                const symbol = $("label[for='" + formula[i][0].id + "'] svg").first().clone(false, false)
                if (symbol.length > 0) {
                    symbol.removeClass("input-prefix")
                    title += symbol.get(0).outerHTML
                    if (i !== formula.length - 1)
                        title += "&nbsp;+&nbsp;"
                }
            }
            title += "</h4>"
        }
        row.get("details-title").html(title)
        let text = ""
        const focus = row.get("time")
        if (focus.length > 0)
            text += "Concentration: " + focus.val() + "<br/>"
        const distance = row.get("distance")
        if (distance.length > 0)
            text += "Portée: " + distance.val() + "<br/>"
        const duration = row.get("duration")
        if (duration.length > 0)
            text += "Durée: " + duration.val() + "<br/>"
        const effect = row.get("effect")
        if (effect.length > 0)
            text += "Effet: " + effect.val()
        row.get("details-effect").html(text)
        row.get("details").modal()
    }

    update_value(e) {
        row_of(e.target).update_roll_value()
    }

    update_title(e) {
        row_of(e.target).update_title()
    }

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        add_save_to_dom_listeners(row.data)
        row.data.find(".row-roll-trigger").uon("click", this.trigger_roll)
        row.data.find(".formula-elem").uon("change", this.formula_changed)
        if (row.id !== this.template_row)
            row.data.find(".formula-elem").next().each((i, elem) => {
                if (!$(elem).hasClass("invisible"))
                    $(elem).tooltip()
            })
        row.data.find("select").uon("changed.bs.select", this.select_changed)
        row.data.find("select.talent-select,select.equipment-select").each((i, elem) => {
            $(elem).selectpicker()
        })
        row.get("show-details").uon("click", this.view_details).tooltip()
        row.get("details-bonus").uon("change", this.update_value)
        row.get("details-min").uon("change", this.update_value)
        row.get("details-max").uon("change", this.update_value)
        if (row.get("tap-talent").length > 0) {
            check_radio(row.get("body")[0])
            check_radio(row.get("action")[0])
            check_radio(row.get("mechanical")[0])
            row.data.find(".formula-elem").attr("disabled", "disabled")
            row.update_roll_value()
        }
        row.get("details-name").uon("change", this.update_title)
    }

    clone_row() {
        return this.template_row.clone(true, false)
    }
}

class CloseCombatRollTable extends TalentRollTable {

    static checked_radio = ["body", "action"]

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)

        check_radio(row.get(this.constructor.checked_radio[0])[0])
        check_radio(row.get(this.constructor.checked_radio[1])[0])
        row.data.find(".formula-elem").filter((i, elem) => {
            return elem.id.search(realms) === -1
        }).attr("disabled", "disabled")
        row.update_roll_value()
    }
}

class RangeCombatRollTable extends CloseCombatRollTable {
    static row_class = RangeRow
    static checked_radio = ["body", "perception"]

    update_effects(e) {
        row_of($(e.target)).update_effects()
    }

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        row.data.find("input.roll-effect").uon("change", this.update_effects)
    }
}

const talent_list_selector = ".talent input[id*='-name']"

/* Helper functions */

const hobbit_regexes = [/[Hh]obbits?/, /[Tt]inigens?/, /[Pp]etites [Gg]ens/, /[Pp]etites? [Pp]ersonnes?/,
    /[Tt]omt[eé]s?/]

function is_hobbit() {
    const race = $("#race").val()
    if (!race || race.length === 0)
        return false
    for (let i in hobbit_regexes) {
        if (race.match(hobbit_regexes[i]) != null)
            return true
    }
    return false
}

/* Triggers */

$("#roll-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#dual_wielding-table tr,#close_combat-table tr,#range_combat-table tr,#roll-table tr"))
})

$("#race,.realm,.component,.means," + talent_list_selector).on("change", _ => {
    // Update all of the spell values
    $(".row-roll-trigger").each((i, elem) => {
        row_of(elem).update_roll_value(elem)
    })
})
