import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="prose-page container">
      <div className="grid-12">
        <div className="prose">
          <h1>Not on the rail</h1>
          <p className="lead">That page does not exist, or the piece has moved.</p>
          <p>
            <Link className="btn" href="/collections/niqabs">See the niqabs</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
