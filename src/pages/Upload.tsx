
import FileUploader from "@/components/FileUploader";

export default function Upload() {
  return (
    <main className="flex-1 p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Upload Battery Data</h1>
          <p className="text-muted-foreground mt-2">
            Upload your `.csv` or `.xlsx` files from Maccor, Arbin, or Neware systems.
          </p>
        </div>
        <FileUploader />
        <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Your data will be processed to compute State of Health, Remaining Useful Life, and other key metrics.</p>
            <p>A Digital Battery Passport will be generated upon successful analysis.</p>
        </div>
      </div>
    </main>
  );
}
