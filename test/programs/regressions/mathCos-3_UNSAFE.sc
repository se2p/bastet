program Mini1Program

actor ActorA begin

    extern _RUNTIME_signalFailure ()

    define atomic math() begin
        declare alpha as int
        define alpha as 30

        if (alpha < 36) then begin
            assume result > 0
        end else if (alpha < 72) then begin
            assume result > 0-1
        end else if (alpha < 108) then begin
            assume result > 0-1
        end
    end returns result: int

    script on startup do begin
        epsilon
        declare dx as int
        define dx as math()
        epsilon
        epsilon
        if not (dx = 10000000) then begin
            _RUNTIME_signalFailure("moveSteps Test")
        end
    end

end