<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;

class NotificationController extends Controller
{
    // GET /api/admin/notifications (admin)
    // Laravel fetches the notification log from the Node.js service and passes it on,
    // so the admin dashboard uses one API (and one login) for everything.
    public function index()
    {
        try {
            $response = Http::timeout(3)->get(config('services.notification.url').'/notifications');

            return response()->json($response->json(), $response->status());
        } catch (\Throwable $e) {
            // 503 Service Unavailable = a service we depend on is down
            return response()->json([
                'message' => 'Notification service is not reachable.',
                'data' => [],
            ], 503);
        }
    }
}
