const FRANKFURTER_API = "https://api.frankfurter.app";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "USD";
    const to = searchParams.get("to") || "IDR";
    const amount = searchParams.get("amount");

    let apiUrl: string;
    
    if (amount) {
      // Convert specific amount
      apiUrl = `${FRANKFURTER_API}/latest?amount=${amount}&from=${from}&to=${to}`;
    } else {
      // Get latest rate
      apiUrl = `${FRANKFURTER_API}/latest?from=${from}&to=${to}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status}`);
    }

    const data = await response.json();

    // Return with CORS headers
    return Response.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Exchange rate API error:", error);
    return Response.json(
      { error: "Failed to fetch exchange rate" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
