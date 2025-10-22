// --- Authorizations.tsx ---
import Authorization from "./authorization";
import { NormalizedSolicitud } from "./interfaces/Interfaces.interfaces";

interface PropsAuth {
  authorizationsData: NormalizedSolicitud[];
  onReview: (auth: NormalizedSolicitud) => void;
}

function Authorizations({ authorizationsData, onReview }: PropsAuth) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {authorizationsData.map((auth) => (
        <Authorization
          key={auth.id}
          auth={auth}
          onReview={() => onReview(auth)}
        />
      ))}
    </div>
  );
}

export default Authorizations;
