program Foo

actor A1 is RuntimeEntity begin

    declare v as integer

    script on startup do begin
    end

end

actor A2 is RuntimeEntity begin

    declare w as integer

    script on startup do begin
        define A1.v as 9
        if not A1.v = 9 then begin
            _RUNTIME_signalFailure()
        end
    end

end
