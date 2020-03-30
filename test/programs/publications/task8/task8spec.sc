program Task6Spec

/**
 * ## Task 8 „Cat touching Ball“
 *
 * Task: The `cat` should `say` "Hab ich dich!" when it touches a ball.
 *
 * Rewrite as bounded safety property:
 *      The cat must always say "Hab ich dich!" whenever it touches the ball.
 *
 * Precondition:
 *      There exists two actors, one with the id "Katze"
 *      and one with the id "Ball"
 *
 * Interpretations and considerations:
 *   - Neither ball nor cat have to be able to move
 *
 * Rewrite without explicit actor names:
 *    Given two actors, at least one of them always says "Hab ich dich!" when
 *    actors touch
 *
 *   EXISTS a in _RUNTIME_getAllActors():
 *     EXISTS b in _RUNTIME_getAllActors(), with b != a:
 *       FORALL trace in PROGRMA_TRACES:
 *         if touching(a,b)
 *           issaying(a, "Hab ich dich!") or issaying(b, "Hab ich dich")
 *
 */

actor DirectorObserver is Observer begin

    declare actor_1_id as string
    declare actor_2_id as string

    declare actors_touching as boolean

    define actor_1_id as "Katze"
    define actor_2_id as "Ball"

    define atomic isBehaviorSatisfied () begin
        define result as false

        if touchingObjects(actor_1_id, actor_2_id) then begin
            if attribute "bubbleText" of actor_1_id = "Hab ich dich!" then begin
                define result as true
            end
        end
    end returns result: boolean

    define atomic storeRelevantStateInfosForNext () begin

    end

    script on bootstrap do begin
    end

    script on bootstrap finished do begin
        // First specification check (base condition)
        assert(isBehaviorSatisfied())

        // Store the relevant attributes
        storeRelevantStateInfosForNext()
    end

    script on statement finished do begin
        // The actual specification check
        assert(isBehaviorSatisfied())

        // Store the relevant attributes
        storeRelevantStateInfosForNext()
    end

end
