import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";

type Column<T> = {
  key: string;
  title: string;
  width?: number;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  minWidth?: number;
};

export default function AdminDataTable<T>({ columns, rows, minWidth = 960 }: Props<T>) {
  return (
    <View style={styles.tableWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth }}>
          <View style={[styles.row, styles.headerRow]}>
            {columns.map((column) => (
              <View key={column.key} style={[styles.cell, column.width ? { width: column.width } : { flex: 1 }]}>
                <Text style={styles.headerText}>{column.title}</Text>
              </View>
            ))}
          </View>

          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.row, rowIndex % 2 === 0 ? styles.even : styles.odd]}>
              {columns.map((column) => (
                <View key={column.key} style={[styles.cell, column.width ? { width: column.width } : { flex: 1 }]}>
                  {column.render(row)}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tableWrap: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: appTheme.colors.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRow: {
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  even: {
    backgroundColor: appTheme.colors.surface,
  },
  odd: {
    backgroundColor: "#FCFDFE",
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: "#EDF2F7",
  },
  headerText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
});
