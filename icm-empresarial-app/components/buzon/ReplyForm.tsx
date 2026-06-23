import { replyCorrespondenciaAction } from "@/lib/buzon/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ReplyFormProps = {
  correspondenciaId: string;
};

export function ReplyForm({ correspondenciaId }: ReplyFormProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">Responder</h2>
      <form action={replyCorrespondenciaAction} className="mt-4 space-y-4">
        <input
          name="correspondencia_id"
          type="hidden"
          value={correspondenciaId}
        />
        <label className="block text-sm font-medium text-ink">
          Mensaje
          <textarea
            className="mt-2 min-h-32 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            minLength={5}
            name="contenido"
            required
          />
        </label>
        <div className="flex justify-end">
          <Button type="submit">Responder</Button>
        </div>
      </form>
    </Card>
  );
}
