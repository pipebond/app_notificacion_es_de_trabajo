// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';

import 'package:app_notificacion_es_de_trabajo/main.dart';

void main() {
  testWidgets('Renderiza modulos de jefes y empleados', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(NotificacionTrabajoApp());

    expect(find.text('Notificacion de Trabajo'), findsWidgets);
    expect(find.text('Modulo jefes'), findsOneWidget);
    expect(find.text('Modulo empleados'), findsOneWidget);
  });
}
