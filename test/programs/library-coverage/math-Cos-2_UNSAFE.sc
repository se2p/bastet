program Mini1Program

actor MiniActor is RuntimeEntity begin

    script on startup do begin
        declare alpha as number
        define alpha as 380

        declare result as number
        define result as mathCos(rad)

        if result > 1 or result < (0-0.128)  then begin
        end else begin
            _RUNTIME_signalFailure()
        end
    end

end

