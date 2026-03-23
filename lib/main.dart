import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

void main() {
  runApp(NotificacionTrabajoApp());
}

class NotificacionTrabajoApp extends StatelessWidget {
  NotificacionTrabajoApp({super.key});

  final AppState appState = AppState(
    api: BackendApi(
      baseUrl: const String.fromEnvironment('API_BASE_URL', defaultValue: ''),
      apiKey: const String.fromEnvironment(
        'API_KEY',
        defaultValue:
            '1bgmrXdlBfx9KzWeiJFc6L4TEQu3HDjGNqM8YhPsC0S5tOU2pwAonva7ZkIVRy',
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFFFF5A36),
      brightness: Brightness.light,
      primary: const Color(0xFFFF5A36),
      secondary: const Color(0xFF00A896),
      tertiary: const Color(0xFFFFBE0B),
      surface: const Color(0xFFFFFCF6),
    );

    return AppStateScope(
      notifier: appState,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'ReportaPro',
        theme: ThemeData(
          colorScheme: colorScheme,
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xFFFFF4EB),
          textTheme: GoogleFonts.soraTextTheme(),
          dividerColor: const Color(0xFFFFDCC8),
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.transparent,
            elevation: 0,
            scrolledUnderElevation: 0,
            centerTitle: true,
          ),
          cardTheme: CardThemeData(
            color: Colors.white.withValues(alpha: 0.9),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: const BorderSide(color: Color(0xFFFFE1D4), width: 1),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: const Color(0xFFFFF8F0),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFFFD8C2)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFFFD8C2)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(
                color: Color(0xFFFF5A36),
                width: 1.6,
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
          ),
          filledButtonTheme: FilledButtonThemeData(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFFF5A36),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
            ),
          ),
          outlinedButtonTheme: OutlinedButtonThemeData(
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF28313B),
              side: const BorderSide(color: Color(0xFFFFC7AF)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
            ),
          ),
          chipTheme: ChipThemeData(
            backgroundColor: const Color(0xFFFFE9DD),
            labelStyle: GoogleFonts.sora(
              color: const Color(0xFF7A2F17),
              fontWeight: FontWeight.w600,
            ),
            side: BorderSide.none,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          snackBarTheme: SnackBarThemeData(
            backgroundColor: const Color(0xFF28313B),
            contentTextStyle: GoogleFonts.sora(
              color: Colors.white,
              fontWeight: FontWeight.w500,
            ),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        home: const HomePage(),
      ),
    );
  }
}

class BackendApi {
  BackendApi({
    required String baseUrl,
    required this.apiKey,
    http.Client? client,
  }) : _client = client ?? http.Client(),
       baseUrl = baseUrl.isNotEmpty ? baseUrl : _defaultBaseUrl();

  final http.Client _client;
  final String baseUrl;
  final String apiKey;

  static String _defaultBaseUrl() {
    if (kIsWeb) {
      return 'http://localhost:4000/api';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:4000/api';
    }
    return 'http://127.0.0.1:4000/api';
  }

  Map<String, String> _headers() {
    return <String, String>{
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    };
  }

  dynamic _decodeBody(http.Response response) {
    if (response.body.isEmpty) {
      return <String, dynamic>{};
    }

    try {
      return jsonDecode(response.body);
    } on FormatException {
      return response.body;
    }
  }

  String _buildResponseErrorMessage(http.Response response, dynamic body) {
    if (body is Map<String, dynamic> && body['message'] is String) {
      var message = body['message'] as String;

      if (body['errors'] is List && (body['errors'] as List).isNotEmpty) {
        final dynamic firstError = (body['errors'] as List).first;
        if (firstError is Map<String, dynamic>) {
          final dynamic field = firstError['path'] ?? firstError['param'];
          final dynamic detail = firstError['msg'];
          if (field is String && detail is String) {
            message = '$message ($field: $detail)';
          }
        }
      }

      return message;
    }

    if (body is String) {
      final normalized = body.replaceAll(RegExp(r'\s+'), ' ').trim();
      if (normalized.isEmpty) {
        return 'Respuesta vacia del servidor';
      }

      final preview =
          normalized.length > 160
              ? '${normalized.substring(0, 160)}...'
              : normalized;

      return 'Respuesta no JSON del servidor: $preview';
    }

    return 'Error de servidor';
  }

  Future<Map<String, dynamic>> _parseJson(http.Response response) async {
    final dynamic body = _decodeBody(response);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (body is Map<String, dynamic>) {
        return body;
      }

      if (body is String) {
        throw Exception(
          'HTTP ${response.statusCode}: respuesta inesperada del servidor',
        );
      }

      return <String, dynamic>{'data': body};
    }

    final message = _buildResponseErrorMessage(response, body);

    throw Exception('HTTP ${response.statusCode}: $message');
  }

  Future<int> createBoss(BossProfile profile) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/bosses'),
      headers: _headers(),
      body: jsonEncode(<String, dynamic>{
        'name': profile.name,
        'companyName': profile.companyName,
        'accessCode': profile.accessCode,
        'position': profile.position,
        'phone': profile.phone,
        'email': profile.email,
        'notes': profile.notes,
        'plan': 'FREE',
      }),
    );

    final data = await _parseJson(response);
    return data['id'] as int;
  }

  Future<BossProfile> getBoss(int bossId) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/bosses/$bossId'),
      headers: _headers(),
    );

    final data = await _parseJson(response);
    return BossProfile.fromJson(data);
  }

  Future<BossProfile> getBossByAccessCode(String accessCode) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/bosses/by-access/$accessCode'),
      headers: _headers(),
    );

    final data = await _parseJson(response);
    return BossProfile.fromJson(data);
  }

  Future<void> updateBoss({
    required int bossId,
    required BossProfile profile,
  }) async {
    final response = await _client.put(
      Uri.parse('$baseUrl/bosses/$bossId'),
      headers: _headers(),
      body: jsonEncode(<String, dynamic>{
        'name': profile.name,
        'companyName': profile.companyName,
        'accessCode': profile.accessCode,
        'position': profile.position,
        'phone': profile.phone,
        'email': profile.email,
        'notes': profile.notes,
        'plan': 'FREE',
      }),
    );

    await _parseJson(response);
  }

  Future<List<EmployeeRecord>> listEmployees(int bossId) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/bosses/$bossId/employees'),
      headers: _headers(),
    );

    final dynamic body = _decodeBody(response);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        'HTTP ${response.statusCode}: ${_buildResponseErrorMessage(response, body)}',
      );
    }
    if (body is! List) {
      return <EmployeeRecord>[];
    }

    return body
        .map<EmployeeRecord>(
          (item) => EmployeeRecord(
            backendId: item['id'] as int?,
            fullName: (item['full_name'] ?? '') as String,
            idNumber: (item['id_number'] ?? '') as String,
            phone: (item['phone'] ?? '') as String,
            email: (item['email'] ?? '') as String,
          ),
        )
        .toList();
  }

  Future<int?> upsertEmployee(int bossId, EmployeeRecord employee) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/bosses/$bossId/employees'),
      headers: _headers(),
      body: jsonEncode(<String, dynamic>{
        'fullName': employee.fullName,
        'idNumber': employee.idNumber,
        'phone': employee.phone,
        'email': employee.email,
      }),
    );

    final data = await _parseJson(response);
    return data['id'] as int?;
  }

  Future<List<String>> uploadImages(List<XFile> images) async {
    if (images.isEmpty) {
      return <String>[];
    }

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/uploads'),
    );
    request.headers['x-api-key'] = apiKey;

    for (var i = 0; i < images.length; i++) {
      final image = images[i];
      if (kIsWeb) {
        final bytes = await image.readAsBytes();
        final fileName = image.name.isNotEmpty ? image.name : 'imagen_$i.jpg';
        final contentType = _guessImageContentType(fileName);
        request.files.add(
          http.MultipartFile.fromBytes(
            'images',
            bytes,
            filename: fileName,
            contentType: contentType,
          ),
        );
      } else {
        request.files.add(
          await http.MultipartFile.fromPath('images', image.path),
        );
      }
    }

    final streamed = await _client.send(request);
    final response = await http.Response.fromStream(streamed);
    final data = await _parseJson(response);

    final dynamic urls = data['imageUrls'];
    if (urls is! List) {
      return <String>[];
    }

    return urls
        .whereType<String>()
        .map((url) => url.trim())
        .where(_isHttpUrl)
        .toList();
  }

  Future<int> createReport({
    required int bossId,
    required int employeeId,
    required String observations,
    required List<String> imageUrls,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/reports'),
      headers: _headers(),
      body: jsonEncode(<String, dynamic>{
        'bossId': bossId,
        'employeeId': employeeId,
        'observations': observations,
        'imageUrls': imageUrls,
      }),
    );

    final data = await _parseJson(response);
    return data['id'] as int;
  }

  Future<List<DailyReport>> listReports(int bossId) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/bosses/$bossId/reports'),
      headers: _headers(),
    );

    final dynamic body = _decodeBody(response);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        'HTTP ${response.statusCode}: ${_buildResponseErrorMessage(response, body)}',
      );
    }
    if (body is! List) {
      return <DailyReport>[];
    }

    return body.map<DailyReport>((item) {
      final createdAtRaw = (item['created_at'] ?? '') as String;
      final imagesRaw = item['images'];
      final List<String> images =
          imagesRaw is List
              ? imagesRaw.whereType<String>().toList()
              : <String>[];

      return DailyReport(
        employeeName: (item['employee_name'] ?? 'Sin nombre') as String,
        employeeId: (item['employee_id'] ?? '').toString(),
        observations: (item['observations'] ?? '') as String,
        imageUrls: images,
        createdAt:
            DateTime.tryParse(createdAtRaw)?.toLocal() ??
            DateTime.now().toLocal(),
      );
    }).toList();
  }

  MediaType _guessImageContentType(String fileName) {
    final lower = fileName.toLowerCase();
    if (lower.endsWith('.png')) {
      return MediaType('image', 'png');
    }
    if (lower.endsWith('.webp')) {
      return MediaType('image', 'webp');
    }
    if (lower.endsWith('.gif')) {
      return MediaType('image', 'gif');
    }
    return MediaType('image', 'jpeg');
  }

  bool _isHttpUrl(String value) {
    final uri = Uri.tryParse(value);
    if (uri == null) {
      return false;
    }

    return uri.hasScheme &&
        (uri.scheme == 'http' || uri.scheme == 'https') &&
        uri.host.isNotEmpty;
  }
}

class AppStateScope extends InheritedNotifier<AppState> {
  const AppStateScope({
    super.key,
    required super.notifier,
    required super.child,
  });

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppStateScope>();
    assert(
      scope != null,
      'AppStateScope no encontrado en el arbol de widgets.',
    );
    return scope!.notifier!;
  }
}

class AppState extends ChangeNotifier {
  AppState({required this.api}) {
    _restoreBossSession();
  }

  static const int maxEmployeesPerBoss = 5;
  static const String _bossIdStorageKey = 'active_boss_id';
  static const String _bossProfileStorageKey = 'active_boss_profile';

  final BackendApi api;
  BossProfile bossProfile = const BossProfile.empty();
  int? bossId;
  List<EmployeeRecord> employees = <EmployeeRecord>[];
  List<DailyReport> reports = <DailyReport>[];
  bool loading = false;

  bool get hasBossRegistered => bossId != null;

  Future<void> saveBossProfile(BossProfile profile) async {
    loading = true;
    notifyListeners();
    try {
      bossProfile = profile;

      if (bossId == null) {
        bossId = await api.createBoss(profile);
        await _persistBossId();
      } else {
        await api.updateBoss(bossId: bossId!, profile: profile);
      }

      await _persistBossProfile();
      await refreshRemoteData();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> activateBossContext(int selectedBossId) async {
    bossId = selectedBossId;
    await _persistBossId();

    try {
      final remoteProfile = await api.getBoss(selectedBossId);
      bossProfile = remoteProfile;
      await _persistBossProfile();
    } catch (_) {
      // Si falla la lectura remota, se conserva el perfil local actual.
    }

    await refreshRemoteData();
  }

  Future<void> refreshRemoteData() async {
    if (bossId == null) {
      return;
    }

    loading = true;
    notifyListeners();
    try {
      final employeesData = await api.listEmployees(bossId!);
      final reportsData = await api.listReports(bossId!);
      employees = employeesData;
      reports = reportsData;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> registerEmployeeReport({
    required EmployeeRecord employee,
    required String observations,
    required List<XFile> images,
  }) async {
    if (bossId == null) {
      throw Exception('Primero debes guardar el perfil del jefe.');
    }

    loading = true;
    notifyListeners();
    try {
      final insertedId = await api.upsertEmployee(bossId!, employee);
      final updatedEmployees = await api.listEmployees(bossId!);
      employees = updatedEmployees;

      int? employeeId = insertedId;
      employeeId ??=
          updatedEmployees
              .where((item) => item.idNumber == employee.idNumber)
              .map((item) => item.backendId)
              .whereType<int>()
              .cast<int?>()
              .firstOrNull;

      if (employeeId == null) {
        throw Exception('No se pudo identificar el empleado en base de datos.');
      }

      final uploadedUrls = await api.uploadImages(images);
      final safeImageUrls =
          uploadedUrls
              .map((url) => url.trim())
              .where(
                (url) =>
                    url.startsWith('http://') || url.startsWith('https://'),
              )
              .toList();

      await api.createReport(
        bossId: bossId!,
        employeeId: employeeId,
        observations: observations,
        imageUrls: safeImageUrls,
      );

      reports = await api.listReports(bossId!);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _restoreBossSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final storedProfile = prefs.getString(_bossProfileStorageKey);
      if (storedProfile != null && storedProfile.isNotEmpty) {
        final dynamic decoded = jsonDecode(storedProfile);
        if (decoded is Map<String, dynamic>) {
          bossProfile = BossProfile.fromJson(decoded);
        }
      }

      final storedBossId = prefs.getInt(_bossIdStorageKey);
      if (storedBossId == null || storedBossId <= 0) {
        notifyListeners();
        return;
      }

      bossId = storedBossId;
      try {
        final remoteProfile = await api.getBoss(storedBossId);
        bossProfile = remoteProfile;
        await _persistBossProfile();
      } catch (_) {
        // Si no se logra leer backend, conserva el perfil local.
      }

      await refreshRemoteData();
    } catch (_) {
      // Ignora errores de almacenamiento local para no bloquear la app.
    }
  }

  Future<void> _persistBossId() async {
    if (bossId == null) {
      return;
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_bossIdStorageKey, bossId!);
  }

  Future<void> _persistBossProfile() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _bossProfileStorageKey,
      jsonEncode(bossProfile.toJson()),
    );
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}

class BossProfile {
  const BossProfile({
    this.id,
    required this.name,
    required this.companyName,
    required this.accessCode,
    required this.position,
    required this.phone,
    required this.email,
    required this.notes,
  });

  const BossProfile.empty()
    : id = null,
      name = '',
      companyName = '',
      accessCode = '',
      position = '',
      phone = '',
      email = '',
      notes = '';

  factory BossProfile.fromJson(Map<String, dynamic> json) {
    final dynamic companyRaw = json['companyName'] ?? json['company_name'];
    final dynamic accessCodeRaw = json['accessCode'] ?? json['access_code'];

    return BossProfile(
      id: json['id'] as int?,
      name: (json['name'] ?? '') as String,
      companyName: (companyRaw ?? '') as String,
      accessCode: (accessCodeRaw ?? '') as String,
      position: (json['position'] ?? '') as String,
      phone: (json['phone'] ?? '') as String,
      email: (json['email'] ?? '') as String,
      notes: (json['notes'] ?? '') as String,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'companyName': companyName,
      'accessCode': accessCode,
      'position': position,
      'phone': phone,
      'email': email,
      'notes': notes,
    };
  }

  final int? id;
  final String name;
  final String companyName;
  final String accessCode;
  final String position;
  final String phone;
  final String email;
  final String notes;
}

class EmployeeRecord {
  const EmployeeRecord({
    required this.fullName,
    required this.idNumber,
    required this.phone,
    required this.email,
    this.backendId,
  });

  final int? backendId;
  final String fullName;
  final String idNumber;
  final String phone;
  final String email;
}

class DailyReport {
  const DailyReport({
    required this.employeeName,
    required this.employeeId,
    required this.observations,
    required this.imageUrls,
    required this.createdAt,
  });

  final String employeeName;
  final String employeeId;
  final String observations;
  final List<String> imageUrls;
  final DateTime createdAt;
}

class AppBackdrop extends StatelessWidget {
  const AppBackdrop({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: DecoratedBox(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFFFFF0E1), Color(0xFFE6FFF9)],
              ),
            ),
          ),
        ),
        Positioned(
          top: -60,
          right: -40,
          child: _GlowCircle(
            size: 180,
            color: const Color(0xFFFFBE0B).withValues(alpha: 0.22),
          ),
        ),
        Positioned(
          top: 90,
          left: -50,
          child: _GlowCircle(
            size: 160,
            color: const Color(0xFFFF5A36).withValues(alpha: 0.20),
          ),
        ),
        Positioned(
          bottom: -70,
          left: 20,
          child: _GlowCircle(
            size: 220,
            color: const Color(0xFF00A896).withValues(alpha: 0.18),
          ),
        ),
        Positioned(
          top: 220,
          right: 24,
          child: _GlowCircle(
            size: 120,
            color: const Color(0xFF3A86FF).withValues(alpha: 0.10),
          ),
        ),
        SafeArea(child: child),
      ],
    );
  }
}

class _GlowCircle extends StatelessWidget {
  const _GlowCircle({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}

class ResponsiveContent extends StatelessWidget {
  const ResponsiveContent({
    super.key,
    required this.child,
    this.maxWidth = 1040,
  });

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final horizontalPadding =
        width >= 1100
            ? 28.0
            : width >= 720
            ? 22.0
            : 16.0;

    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            horizontalPadding,
            12,
            horizontalPadding,
            28,
          ),
          child: child,
        ),
      ),
    );
  }
}

class HeroBanner extends StatelessWidget {
  const HeroBanner({
    super.key,
    required this.title,
    required this.subtitle,
    required this.colors,
    this.badge,
    this.trailing,
  });

  final String title;
  final String subtitle;
  final List<Color> colors;
  final String? badge;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colors,
        ),
        boxShadow: [
          BoxShadow(
            color: colors.first.withValues(alpha: 0.24),
            blurRadius: 28,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (badge != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.18),
                      ),
                    ),
                    child: Text(
                      badge!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    height: 1.1,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.92),
                    fontSize: 14,
                    height: 1.45,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          if (trailing != null) ...[const SizedBox(width: 16), trailing!],
        ],
      ),
    );
  }
}

class StatPill extends StatelessWidget {
  const StatPill({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.tint = const Color(0xFFFFF1E7),
  });

  final String label;
  final String value;
  final IconData? icon;
  final Color tint;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: tint,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 18, color: const Color(0xFF7A2F17)),
            const SizedBox(width: 8),
          ],
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: Color(0xFF1F2328),
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
    this.action,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          subtitle!,
                          style: Theme.of(
                            context,
                          ).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF5E6773),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (action != null) ...[const SizedBox(width: 12), action!],
              ],
            ),
            const SizedBox(height: 16),
            child,
          ],
        ),
      ),
    );
  }
}

class EmptyStateCard extends StatelessWidget {
  const EmptyStateCard({
    super.key,
    required this.title,
    required this.message,
    required this.icon,
  });

  final String title;
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8F0),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFFE1D4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: const Color(0xFFFFE4D6),
            child: Icon(icon, color: const Color(0xFFFF5A36)),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            message,
            style: const TextStyle(color: Color(0xFF5E6773), height: 1.5),
          ),
        ],
      ),
    );
  }
}

class ModuleSummaryStrip extends StatelessWidget {
  const ModuleSummaryStrip({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Wrap(spacing: 12, runSpacing: 12, children: children);
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

enum UserRole { boss, employee }

extension UserRoleLabel on UserRole {
  String get label {
    switch (this) {
      case UserRole.boss:
        return 'Jefe';
      case UserRole.employee:
        return 'Empleado';
    }
  }
}

enum AuthMode { login, register }

class AppUser {
  const AppUser({
    required this.fullName,
    required this.email,
    required this.password,
    required this.role,
    required this.bossId,
    required this.companyName,
    required this.dataAuthorized,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    final roleRaw = (json['role'] ?? 'employee') as String;
    final dynamic bossIdRaw = json['bossId'];
    int? bossIdParsed;
    if (bossIdRaw is int) {
      bossIdParsed = bossIdRaw;
    } else if (bossIdRaw is num) {
      bossIdParsed = bossIdRaw.toInt();
    } else if (bossIdRaw is String) {
      bossIdParsed = int.tryParse(bossIdRaw);
    }

    final dynamic authRaw = json['dataAuthorized'];
    final bool dataAuthorizedParsed =
        authRaw is bool
            ? authRaw
            : (authRaw is String ? authRaw.toLowerCase() == 'true' : false);

    return AppUser(
      fullName: (json['fullName'] ?? '') as String,
      email: (json['email'] ?? '') as String,
      password: (json['password'] ?? '') as String,
      role: roleRaw == 'boss' ? UserRole.boss : UserRole.employee,
      bossId: bossIdParsed,
      companyName: (json['companyName'] ?? '') as String,
      dataAuthorized: dataAuthorizedParsed,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'fullName': fullName,
      'email': email,
      'password': password,
      'role': role == UserRole.boss ? 'boss' : 'employee',
      'bossId': bossId,
      'companyName': companyName,
      'dataAuthorized': dataAuthorized,
    };
  }

  final String fullName;
  final String email;
  final String password;
  final UserRole role;
  final int? bossId;
  final String companyName;
  final bool dataAuthorized;
}

class _HomePageState extends State<HomePage> {
  static const String _usersStorageKey = 'app_users_v1';

  final loginEmailController = TextEditingController();
  final loginPasswordController = TextEditingController();
  final registerNameController = TextEditingController();
  final registerEmailController = TextEditingController();
  final registerPasswordController = TextEditingController();
  final registerCompanyController = TextEditingController();
  final registerAccessCodeController = TextEditingController();
  final registerPositionController = TextEditingController();

  AuthMode authMode = AuthMode.login;
  UserRole? selectedLoginRole;
  UserRole selectedRegisterRole = UserRole.employee;
  UserRole? activeRole;
  String activeUserName = '';
  bool dataAuthorizationChecked = false;
  bool usersLoaded = false;
  List<AppUser> users = <AppUser>[];

  @override
  void initState() {
    super.initState();
    _loadUsers();
    Future<void>.delayed(const Duration(seconds: 4), () {
      if (!mounted || usersLoaded) {
        return;
      }
      setState(() {
        usersLoaded = true;
      });
    });
  }

  @override
  void dispose() {
    loginEmailController.dispose();
    loginPasswordController.dispose();
    registerNameController.dispose();
    registerEmailController.dispose();
    registerPasswordController.dispose();
    registerCompanyController.dispose();
    registerAccessCodeController.dispose();
    registerPositionController.dispose();
    super.dispose();
  }

  Future<void> _loadUsers() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawUsers = prefs.getString(_usersStorageKey);

      if (rawUsers != null && rawUsers.isNotEmpty) {
        final dynamic decoded = jsonDecode(rawUsers);
        if (decoded is List) {
          users =
              decoded
                  .whereType<Map>()
                  .map(
                    (item) => AppUser.fromJson(
                      item.map((key, value) => MapEntry(key.toString(), value)),
                    ),
                  )
                  .toList();
        } else {
          await prefs.remove(_usersStorageKey);
          users = <AppUser>[];
        }
      }
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_usersStorageKey);
      users = <AppUser>[];
    } finally {
      if (mounted) {
        setState(() {
          usersLoaded = true;
        });
      }
    }
  }

  Future<void> _persistUsers() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _usersStorageKey,
      jsonEncode(users.map((user) => user.toJson()).toList()),
    );
  }

  Future<void> _register(AppState appState) async {
    final fullName = registerNameController.text.trim();
    final email = registerEmailController.text.trim().toLowerCase();
    final password = registerPasswordController.text;
    final companyName = registerCompanyController.text.trim();
    final accessCode = registerAccessCodeController.text.trim();
    final position = registerPositionController.text.trim();

    if (fullName.isEmpty ||
        email.isEmpty ||
        password.length < 6 ||
        !dataAuthorizationChecked) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Completa datos basicos, clave (min 6) y autoriza tratamiento de datos.',
          ),
        ),
      );
      return;
    }

    if (users.any((user) => user.email == email)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ese correo ya esta registrado. Inicia sesion.'),
        ),
      );
      return;
    }

    int? linkedBossId;
    String linkedCompany = '';

    try {
      if (selectedRegisterRole == UserRole.boss) {
        if (companyName.isEmpty || accessCode.length < 4) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Como jefe debes registrar empresa e ID de empresa (min 4).',
              ),
            ),
          );
          return;
        }

        await appState.saveBossProfile(
          BossProfile(
            name: fullName,
            companyName: companyName,
            accessCode: accessCode,
            position: position.isNotEmpty ? position : 'Jefe de equipo',
            phone: '',
            email: email,
            notes: 'Cuenta creada desde registro',
          ),
        );

        linkedBossId = appState.bossId;
        linkedCompany = companyName;
      } else {
        if (accessCode.length < 4) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Como empleado debes ingresar el ID de empresa.'),
            ),
          );
          return;
        }

        final bossData = await appState.api.getBossByAccessCode(accessCode);
        linkedCompany = bossData.companyName;
        linkedBossId = bossData.id;

        if (linkedBossId == null || linkedBossId <= 0) {
          throw Exception('No se pudo resolver el jefe por ID de empresa.');
        }
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error en registro: $error')));
      return;
    }

    users = [
      ...users,
      AppUser(
        fullName: fullName,
        email: email,
        password: password,
        role: selectedRegisterRole,
        bossId: linkedBossId,
        companyName: linkedCompany,
        dataAuthorized: dataAuthorizationChecked,
      ),
    ];
    await _persistUsers();

    if (!mounted) {
      return;
    }

    setState(() {
      authMode = AuthMode.login;
      loginEmailController.text = email;
      loginPasswordController.clear();
      registerPasswordController.clear();
      dataAuthorizationChecked = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Registro exitoso. Ahora inicia sesion.')),
    );
  }

  Future<void> _login(AppState appState) async {
    final email = loginEmailController.text.trim().toLowerCase();
    final password = loginPasswordController.text;

    if (email.isEmpty || password.isEmpty || selectedLoginRole == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Completa correo, clave y rol para iniciar sesion.'),
        ),
      );
      return;
    }

    final user =
        users.where((item) {
          return item.email == email &&
              item.password == password &&
              item.role == selectedLoginRole;
        }).firstOrNull;

    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Credenciales o rol incorrectos.')),
      );
      return;
    }

    if (user.bossId == null || user.bossId! <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cuenta sin vinculo de empresa. Registra de nuevo.'),
        ),
      );
      return;
    }

    try {
      await appState.activateBossContext(user.bossId!);
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al iniciar sesion: $error')),
      );
      return;
    }

    if (!mounted) {
      return;
    }

    setState(() {
      activeUserName = user.fullName;
      activeRole = user.role;
    });
  }

  void _logout() {
    setState(() {
      activeRole = null;
      activeUserName = '';
      selectedLoginRole = null;
      loginPasswordController.clear();
    });
  }

  void _switchAuthMode(AuthMode mode) {
    setState(() {
      authMode = mode;
      dataAuthorizationChecked = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);

    if (activeRole == null) {
      if (!usersLoaded) {
        return const Scaffold(
          body: AppBackdrop(
            child: Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Preparando tu espacio de trabajo...'),
                  ],
                ),
              ),
            ),
          ),
        );
      }

      return Scaffold(
        appBar: AppBar(
          title: Text(
            authMode == AuthMode.login ? 'Inicio de sesion' : 'Registro',
          ),
          centerTitle: true,
        ),
        body: AppBackdrop(
          child: ResponsiveContent(
            maxWidth: 920,
            child: ListView(
              children: [
                HeroBanner(
                  badge: 'Lista para una release mas pro',
                  title: 'Controla reportes, equipos y evidencia diaria',
                  subtitle:
                      'La app ya tiene separacion por rol. Este paso la deja con una presencia mas limpia y confiable para publicar.',
                  colors: const [Color(0xFFFF5A36), Color(0xFFFF8A00)],
                  trailing: Container(
                    width: 86,
                    height: 86,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Icon(
                      Icons.verified_user_rounded,
                      color: Colors.white,
                      size: 42,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const ModuleSummaryStrip(
                  children: [
                    StatPill(
                      label: 'Roles activos',
                      value: '2 modulos',
                      icon: Icons.layers_rounded,
                    ),
                    StatPill(
                      label: 'Registro local',
                      value: 'Onboarding',
                      icon: Icons.person_add_alt_1_rounded,
                      tint: Color(0xFFE7FFF8),
                    ),
                    StatPill(
                      label: 'Sincronizacion',
                      value: 'Backend listo',
                      icon: Icons.cloud_done_rounded,
                      tint: Color(0xFFEAF1FF),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SectionCard(
                  title:
                      authMode == AuthMode.login
                          ? 'Acceso por rol'
                          : 'Crear cuenta por rol',
                  subtitle:
                      authMode == AuthMode.login
                          ? 'Entra rapido como jefe o empleado para abrir el modulo correspondiente.'
                          : 'Crea una cuenta vinculada a la empresa y deja la experiencia lista para uso real.',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (authMode == AuthMode.login) ...[
                        TextField(
                          controller: loginEmailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Correo',
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: loginPasswordController,
                          obscureText: true,
                          decoration: const InputDecoration(labelText: 'Clave'),
                        ),
                        const SizedBox(height: 10),
                        DropdownButtonFormField<UserRole>(
                          initialValue: selectedLoginRole,
                          decoration: const InputDecoration(
                            labelText: 'Rol de ingreso',
                          ),
                          items:
                              UserRole.values
                                  .map(
                                    (role) => DropdownMenuItem<UserRole>(
                                      value: role,
                                      child: Text(role.label),
                                    ),
                                  )
                                  .toList(),
                          onChanged: (value) {
                            setState(() {
                              selectedLoginRole = value;
                            });
                          },
                        ),
                      ] else ...[
                        TextField(
                          controller: registerNameController,
                          decoration: const InputDecoration(
                            labelText: 'Nombre completo',
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: registerEmailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Correo',
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: registerPasswordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Clave (minimo 6)',
                          ),
                        ),
                        const SizedBox(height: 10),
                        DropdownButtonFormField<UserRole>(
                          initialValue: selectedRegisterRole,
                          decoration: const InputDecoration(
                            labelText: 'Rol de la cuenta',
                          ),
                          items:
                              UserRole.values
                                  .map(
                                    (role) => DropdownMenuItem<UserRole>(
                                      value: role,
                                      child: Text(role.label),
                                    ),
                                  )
                                  .toList(),
                          onChanged: (value) {
                            if (value == null) {
                              return;
                            }
                            setState(() {
                              selectedRegisterRole = value;
                            });
                          },
                        ),
                        const SizedBox(height: 10),
                        if (selectedRegisterRole == UserRole.boss) ...[
                          TextField(
                            controller: registerCompanyController,
                            decoration: const InputDecoration(
                              labelText: 'Nombre de la empresa',
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: registerPositionController,
                            decoration: const InputDecoration(
                              labelText: 'Cargo del jefe',
                            ),
                          ),
                          const SizedBox(height: 10),
                        ],
                        TextField(
                          controller: registerAccessCodeController,
                          decoration: InputDecoration(
                            labelText:
                                selectedRegisterRole == UserRole.boss
                                    ? 'ID de empresa (crealo para tus empleados)'
                                    : 'ID de empresa entregado por tu jefe',
                          ),
                        ),
                        const SizedBox(height: 10),
                        CheckboxListTile(
                          value: dataAuthorizationChecked,
                          contentPadding: EdgeInsets.zero,
                          onChanged: (value) {
                            setState(() {
                              dataAuthorizationChecked = value ?? false;
                            });
                          },
                          title: const Text(
                            'Autorizo el tratamiento y uso de mis datos para operar la app.',
                          ),
                          subtitle: const Text(
                            'Esto ayuda a que el onboarding se vea mas serio para una version de tienda.',
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      if (appState.bossProfile.companyName.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color:
                                Theme.of(context).colorScheme.surfaceContainer,
                          ),
                          child: Text(
                            'Empresa registrada: ${appState.bossProfile.companyName}',
                          ),
                        ),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed:
                            () =>
                                authMode == AuthMode.login
                                    ? _login(appState)
                                    : _register(appState),
                        icon: Icon(
                          authMode == AuthMode.login
                              ? Icons.login_rounded
                              : Icons.person_add_alt_1_rounded,
                        ),
                        label: Text(
                          authMode == AuthMode.login
                              ? 'Iniciar sesion'
                              : 'Crear cuenta',
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed:
                            () => _switchAuthMode(
                              authMode == AuthMode.login
                                  ? AuthMode.register
                                  : AuthMode.login,
                            ),
                        child: Text(
                          authMode == AuthMode.login
                              ? 'Si no tienes cuenta, registrate'
                              : 'Ya tienes cuenta? Inicia sesion',
                        ),
                      ),
                      const SizedBox(height: 12),
                      const EmptyStateCard(
                        title: 'Siguiente paso para Play Store',
                        message:
                            'Cuando quieras, el siguiente pulido natural es sumar icono final, splash, nombre comercial y textos mas cortos para onboarding.',
                        icon: Icons.rocket_launch_rounded,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final isBoss = activeRole == UserRole.boss;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          isBoss
              ? 'Modulo Jefe - $activeUserName'
              : 'Modulo Empleado - $activeUserName',
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: _logout,
            tooltip: 'Cerrar sesion',
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: AppBackdrop(
        child: isBoss ? const BossModuleScreen() : const EmployeeModuleScreen(),
      ),
    );
  }
}

class BossModuleScreen extends StatefulWidget {
  const BossModuleScreen({super.key});

  @override
  State<BossModuleScreen> createState() => _BossModuleScreenState();
}

class _BossModuleScreenState extends State<BossModuleScreen> {
  final nameController = TextEditingController();
  final companyController = TextEditingController();
  final accessCodeController = TextEditingController();
  final positionController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();
  final notesController = TextEditingController();
  bool initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!initialized) {
      final profile = AppStateScope.of(context).bossProfile;
      nameController.text = profile.name;
      companyController.text = profile.companyName;
      accessCodeController.text = profile.accessCode;
      positionController.text = profile.position;
      phoneController.text = profile.phone;
      emailController.text = profile.email;
      notesController.text = profile.notes;
      initialized = true;
    }
  }

  @override
  void dispose() {
    nameController.dispose();
    companyController.dispose();
    accessCodeController.dispose();
    positionController.dispose();
    phoneController.dispose();
    emailController.dispose();
    notesController.dispose();
    super.dispose();
  }

  String _formatDate(DateTime dateTime) {
    final day = dateTime.day.toString().padLeft(2, '0');
    final month = dateTime.month.toString().padLeft(2, '0');
    final year = dateTime.year;
    final hour = dateTime.hour.toString().padLeft(2, '0');
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$day/$month/$year $hour:$minute';
  }

  Future<void> _openWhatsApp(BuildContext context, String phone) async {
    final digits = phone.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Configura un numero de WhatsApp valido.'),
        ),
      );
      return;
    }

    final uri = Uri.parse('https://wa.me/$digits');
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);

    if (!launched && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo abrir WhatsApp.')),
      );
    }
  }

  Future<void> _openEmail(BuildContext context, String email) async {
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Configura un correo de contacto.')),
      );
      return;
    }

    final uri = Uri(
      scheme: 'mailto',
      path: email,
      queryParameters: const <String, String>{
        'subject': 'Contacto desde app de reportes',
      },
    );

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);

    if (!launched && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo abrir la app de correo.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    final employeeCount = appState.employees.length;
    final limitReached = employeeCount >= AppState.maxEmployeesPerBoss;

    return RefreshIndicator(
      onRefresh: appState.refreshRemoteData,
      child: ResponsiveContent(
        child: ListView(
          children: [
            HeroBanner(
              badge: 'Vista jefe',
              title: 'Coordina tu equipo y revisa evidencia del dia',
              subtitle:
                  appState.bossProfile.companyName.isNotEmpty
                      ? 'Empresa activa: ${appState.bossProfile.companyName}. Mantener este panel limpio y claro ayuda mucho para una primera impresion de tienda.'
                      : 'Configura tu empresa para personalizar el modulo del empleado y dejar el flujo listo para operacion.',
              colors: const [Color(0xFF00A896), Color(0xFF02C39A)],
              trailing: const Icon(
                Icons.admin_panel_settings_rounded,
                color: Colors.white,
                size: 46,
              ),
            ),
            const SizedBox(height: 16),
            ModuleSummaryStrip(
              children: [
                StatPill(
                  label: 'Empleados activos',
                  value: '$employeeCount/${AppState.maxEmployeesPerBoss}',
                  icon: Icons.groups_2_rounded,
                  tint: const Color(0xFFE7FFF8),
                ),
                StatPill(
                  label: 'Reportes cargados',
                  value: '${appState.reports.length}',
                  icon: Icons.assignment_turned_in_rounded,
                  tint: const Color(0xFFEAF1FF),
                ),
                StatPill(
                  label: 'Canal directo',
                  value:
                      appState.bossProfile.phone.isNotEmpty
                          ? 'WhatsApp listo'
                          : 'Configuralo',
                  icon: Icons.chat_rounded,
                ),
              ],
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Perfil del jefe',
              subtitle:
                  'Define nombre visible, empresa, codigo de acceso y canales de contacto.',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(
                      labelText: 'Nombre del jefe',
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: companyController,
                    decoration: const InputDecoration(
                      labelText: 'Nombre de la empresa',
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: accessCodeController,
                    decoration: const InputDecoration(
                      labelText: 'ID de empresa (para vincular empleados)',
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: positionController,
                    decoration: const InputDecoration(labelText: 'Cargo'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Numero WhatsApp',
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Correo'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: notesController,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Notas del jefe',
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed:
                        appState.loading
                            ? null
                            : () async {
                              try {
                                await appState.saveBossProfile(
                                  BossProfile(
                                    name: nameController.text.trim(),
                                    companyName: companyController.text.trim(),
                                    accessCode:
                                        accessCodeController.text.trim(),
                                    position: positionController.text.trim(),
                                    phone: phoneController.text.trim(),
                                    email: emailController.text.trim(),
                                    notes: notesController.text.trim(),
                                  ),
                                );
                                if (!context.mounted) {
                                  return;
                                }
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      appState.hasBossRegistered
                                          ? 'Perfil sincronizado con backend. Jefe ID: ${appState.bossId}'
                                          : 'Perfil guardado.',
                                    ),
                                  ),
                                );
                              } catch (error) {
                                if (!context.mounted) {
                                  return;
                                }
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Error: $error')),
                                );
                              }
                            },
                    icon: const Icon(Icons.save_rounded),
                    label: Text(
                      appState.loading
                          ? 'Guardando...'
                          : 'Guardar perfil del jefe',
                    ),
                  ),
                  if (appState.hasBossRegistered) ...[
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed:
                          appState.loading
                              ? null
                              : () async {
                                try {
                                  await appState.refreshRemoteData();
                                } catch (error) {
                                  if (!context.mounted) {
                                    return;
                                  }
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Error: $error')),
                                  );
                                }
                              },
                      icon: const Icon(Icons.sync_rounded),
                      label: const Text('Refrescar datos remotos'),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Capacidad del plan',
              subtitle:
                  'Una lectura rapida del limite ayuda a que el panel se entienda mejor en una demo o publicacion.',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Registrados: $employeeCount/${AppState.maxEmployeesPerBoss}',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: employeeCount / AppState.maxEmployeesPerBoss,
                    minHeight: 10,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    limitReached
                        ? 'Llegaste al limite de 5 personas. Para agregar mas, debes pagar plan premium.'
                        : 'Aun tienes cupos para registrar empleados.',
                    style: TextStyle(
                      color:
                          limitReached
                              ? Theme.of(context).colorScheme.error
                              : null,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Equipo registrado',
              subtitle:
                  'Lista breve, legible y mas presentable para demo comercial o captura de tienda.',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (appState.employees.isEmpty)
                    const EmptyStateCard(
                      title: 'Sin empleados todavia',
                      message:
                          'Cuando el primer empleado envie su formulario, aparecera aqui con sus datos principales.',
                      icon: Icons.group_off_rounded,
                    )
                  else
                    ...appState.employees.map(
                      (employee) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFFFFE8DD),
                          child: Text(
                            employee.fullName.isNotEmpty
                                ? employee.fullName.characters.first
                                    .toUpperCase()
                                : '?',
                            style: const TextStyle(
                              color: Color(0xFFFF5A36),
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        title: Text(employee.fullName),
                        subtitle: Text(
                          'ID: ${employee.idNumber} | Tel: ${employee.phone} | ${employee.email}',
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Contacto directo',
              subtitle:
                  'Accesos rapidos utiles para una version movil lista para uso diario.',
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  ElevatedButton.icon(
                    onPressed:
                        () =>
                            _openWhatsApp(context, appState.bossProfile.phone),
                    icon: const Icon(Icons.chat_rounded),
                    label: const Text('WhatsApp'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF25D366),
                      foregroundColor: Colors.white,
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed:
                        () => _openEmail(context, appState.bossProfile.email),
                    icon: const Icon(Icons.email_rounded),
                    label: const Text('Correo'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Muro de reportes del dia',
              subtitle:
                  'Este bloque ya queda con una lectura visual mas clara para capturas y presentaciones.',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (appState.reports.isEmpty)
                    const EmptyStateCard(
                      title: 'Sin reportes aun',
                      message:
                          'Cuando los empleados empiecen a cargar evidencia, veras aqui fotos, observaciones y hora de registro.',
                      icon: Icons.photo_album_outlined,
                    )
                  else
                    ...appState.reports.map(
                      (report) => Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.86),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: Theme.of(context).dividerColor,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${report.employeeName} (${report.employeeId})',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(_formatDate(report.createdAt)),
                            const SizedBox(height: 8),
                            if (report.imageUrls.isNotEmpty)
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: _buildReportImage(
                                  report.imageUrls.first,
                                ),
                              )
                            else
                              Container(
                                height: 120,
                                decoration: BoxDecoration(
                                  color: Colors.black12,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                alignment: Alignment.center,
                                child: const Icon(
                                  Icons.photo_size_select_actual_outlined,
                                ),
                              ),
                            const SizedBox(height: 8),
                            Text(report.observations),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class EmployeeModuleScreen extends StatefulWidget {
  const EmployeeModuleScreen({super.key});

  @override
  State<EmployeeModuleScreen> createState() => _EmployeeModuleScreenState();
}

class _EmployeeModuleScreenState extends State<EmployeeModuleScreen> {
  final formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final idController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();
  final observationsController = TextEditingController();
  final picker = ImagePicker();

  List<XFile> selectedImages = <XFile>[];

  @override
  void dispose() {
    nameController.dispose();
    idController.dispose();
    phoneController.dispose();
    emailController.dispose();
    observationsController.dispose();
    super.dispose();
  }

  Future<void> pickImages() async {
    final images = await picker.pickMultiImage();
    if (images.isEmpty) {
      return;
    }

    setState(() {
      selectedImages = images;
    });
  }

  Future<void> submit(BuildContext context) async {
    if (!formKey.currentState!.validate()) {
      return;
    }

    final appState = AppStateScope.of(context);
    final employee = EmployeeRecord(
      fullName: nameController.text.trim(),
      idNumber: idController.text.trim(),
      phone: phoneController.text.trim(),
      email: emailController.text.trim(),
    );

    try {
      await appState.registerEmployeeReport(
        employee: employee,
        observations: observationsController.text.trim(),
        images: selectedImages,
      );

      observationsController.clear();
      setState(() {
        selectedImages = <XFile>[];
      });

      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Reporte enviado y sincronizado con backend.'),
        ),
      );
    } catch (error) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $error')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);

    return RefreshIndicator(
      onRefresh: appState.refreshRemoteData,
      child: ResponsiveContent(
        maxWidth: 900,
        child: ListView(
          children: [
            HeroBanner(
              badge: 'Vista empleado',
              title: 'Carga tu avance diario en pocos pasos',
              subtitle:
                  appState.bossProfile.companyName.isNotEmpty
                      ? 'Empresa vinculada: ${appState.bossProfile.companyName}. La idea aqui es que el formulario se sienta ligero y claro.'
                      : 'La empresa se configurara desde el modulo del jefe para completar la experiencia.',
              colors: const [Color(0xFF3A86FF), Color(0xFF8338EC)],
              trailing: const Icon(
                Icons.construction_rounded,
                color: Colors.white,
                size: 46,
              ),
            ),
            const SizedBox(height: 16),
            ModuleSummaryStrip(
              children: [
                StatPill(
                  label: 'Empresa',
                  value:
                      appState.bossProfile.companyName.isNotEmpty
                          ? 'Vinculada'
                          : 'Pendiente',
                  icon: Icons.apartment_rounded,
                ),
                StatPill(
                  label: 'Fotos',
                  value: '${selectedImages.length} cargadas',
                  icon: Icons.photo_library_rounded,
                  tint: const Color(0xFFEAF1FF),
                ),
                StatPill(
                  label: 'Sincronizacion',
                  value: appState.loading ? 'En curso' : 'Disponible',
                  icon: Icons.cloud_upload_rounded,
                  tint: const Color(0xFFE7FFF8),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'Formulario de empleados',
              subtitle:
                  'Un formulario corto y enfocado funciona mejor cuando luego toque adaptarlo a capturas de Play Store.',
              child: Form(
                key: formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      appState.hasBossRegistered
                          ? 'Registros activos para el jefe: ${appState.employees.length}/${AppState.maxEmployeesPerBoss}'
                          : 'Primero registra al jefe para habilitar sincronizacion.',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        color: Theme.of(context).colorScheme.surfaceContainer,
                      ),
                      child: Text(
                        appState.bossProfile.companyName.isNotEmpty
                            ? 'Empresa asignada: ${appState.bossProfile.companyName}'
                            : 'Empresa asignada: Pendiente por configurar en el modulo del jefe.',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Nombre completo',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Ingresa el nombre.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: idController,
                      decoration: const InputDecoration(
                        labelText: 'Identificacion',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Ingresa la identificacion.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Telefono'),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Correo'),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: observationsController,
                      minLines: 3,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Observaciones de lo realizado en el dia',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Ingresa observaciones del dia.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: pickImages,
                      icon: const Icon(Icons.photo_library_rounded),
                      label: const Text('Subir imagen o imagenes'),
                    ),
                    if (selectedImages.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      SizedBox(
                        height: 90,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: selectedImages.length,
                          separatorBuilder:
                              (context, index) => const SizedBox(width: 8),
                          itemBuilder: (context, index) {
                            final file = selectedImages[index];
                            return ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child:
                                  kIsWeb
                                      ? Image.network(
                                        file.path,
                                        width: 90,
                                        fit: BoxFit.cover,
                                        errorBuilder: (
                                          context,
                                          error,
                                          stackTrace,
                                        ) {
                                          return Container(
                                            width: 90,
                                            color: Colors.black12,
                                            alignment: Alignment.center,
                                            child: const Icon(
                                              Icons.image_not_supported_rounded,
                                            ),
                                          );
                                        },
                                      )
                                      : Image.file(
                                        File(file.path),
                                        width: 90,
                                        fit: BoxFit.cover,
                                        errorBuilder: (
                                          context,
                                          error,
                                          stackTrace,
                                        ) {
                                          return Container(
                                            width: 90,
                                            color: Colors.black12,
                                            alignment: Alignment.center,
                                            child: const Icon(
                                              Icons.image_not_supported_rounded,
                                            ),
                                          );
                                        },
                                      ),
                            );
                          },
                        ),
                      ),
                    ],
                    if (selectedImages.isEmpty) ...[
                      const SizedBox(height: 12),
                      const EmptyStateCard(
                        title: 'Sin fotos seleccionadas',
                        message:
                            'Puedes enviar el reporte solo con observaciones o adjuntar evidencia cuando la tengas lista.',
                        icon: Icons.add_a_photo_outlined,
                      ),
                    ],
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed:
                          appState.loading ? null : () => submit(context),
                      icon: const Icon(Icons.send_rounded),
                      label: Text(
                        appState.loading
                            ? 'Sincronizando...'
                            : 'Enviar reporte del dia',
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Widget _buildReportImage(String imageUrl) {
  final isRemoteLike =
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('blob:') ||
      imageUrl.startsWith('data:');

  if (kIsWeb || isRemoteLike) {
    return Image.network(
      imageUrl,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) {
        return Container(
          height: 120,
          color: Colors.black12,
          alignment: Alignment.center,
          child: const Icon(Icons.image_not_supported_rounded),
        );
      },
    );
  }

  return Image.file(
    File(imageUrl),
    fit: BoxFit.cover,
    errorBuilder: (context, error, stackTrace) {
      return Container(
        height: 120,
        color: Colors.black12,
        alignment: Alignment.center,
        child: const Icon(Icons.image_not_supported_rounded),
      );
    },
  );
}
