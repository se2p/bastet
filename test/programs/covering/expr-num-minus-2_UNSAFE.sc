program Mini1Program

actor MiniActor is RuntimeEntity begin

    script on startup do begin
        declare a as number
        declare b as number
        declare c as number

        define a as 1
        define b as 2
        define c as 3

        if c - b - a = 0 then begin
            _RUNTIME_signalFailure()
        end
    end

end

