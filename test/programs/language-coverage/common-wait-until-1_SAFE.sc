program Mini1Program

actor MiniActor is RuntimeEntity begin

    declare x as int
    define x as 1

    script on startup do begin
        wait until x > 10
        _RUNTIME_signalFailure()
    end

end

