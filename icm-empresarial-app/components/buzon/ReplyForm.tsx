import { replyCorrespondenciaAction } from "@/lib/buzon/actions";
import { Button } from "@/components/ui/Button";

type ReplyFormProps = {
  correspondenciaId: string;
};

export function ReplyForm({ correspondenciaId }: ReplyFormProps) {
  return (
    <form
      action={replyCorrespondenciaAction}
      className="rounded-xl border border-border bg-white p-3 shadow-sm"
    >
      <input name="correspondencia_id" type="hidden" value={correspondenciaId} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-medium text-ink">
          Respuesta
          <textarea
            className="mt-2 min-h-20 w-full resize-y rounded-lg border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            minLength={5}
            name="contenido"
            placeholder="Escribir respuesta formal..."
            required
          />
        </label>
        <Button className="sm:mb-0.5" type="submit">
          Enviar respuesta
        </Button>
      </div>
    </form>
  );
}
