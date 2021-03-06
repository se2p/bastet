program Mini1Program

actor MiniActor is RuntimeEntity begin

    declare x as int
    define x as 0

    script on startup do begin
        define x as 1
        create clone of "MiniActor"
    end

    script on started as clone do begin
        if x = 1 then begin
            _RUNTIME_signalFailure()
        end
    end

end

