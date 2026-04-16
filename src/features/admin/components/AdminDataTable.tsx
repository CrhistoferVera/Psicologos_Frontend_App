import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

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

export default function AdminDataTable<T>({ columns, rows, minWidth = 980 }: Props<T>) {
  return (
    <View style={styles.tableWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth }}>
          <View style={[styles.row, styles.headerRow]}>
            {columns.map((column, index) => (
              <View
                key={column.key}
                style={[
                  styles.cell,
                  column.width ? { width: column.width } : { flex: 1 },
                  index === columns.length - 1 && styles.lastCell,
                ]}
              >
                <Text style={styles.headerText}>{column.title}</Text>
              </View>
            ))}
          </View>

          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.row, rowIndex % 2 === 0 ? styles.even : styles.odd]}>
              {columns.map((column, index) => (
                <View
                  key={column.key}
                  style={[
                    styles.cell,
                    column.width ? { width: column.width } : { flex: 1 },
                    index === columns.length - 1 && styles.lastCell,
                  ]}
                >
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
    borderColor: "#D7E2EF",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EEF7",
  },
  headerRow: {
    backgroundColor: "#F3F7FC",
  },
  even: {
    backgroundColor: "#FFFFFF",
  },
  odd: {
    backgroundColor: "#FCFEFF",
  },
  cell: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: "#EDF3FA",
  },
  lastCell: {
    borderRightWidth: 0,
  },
  headerText: {
    color: "#637B99",
    fontFamily: "Inter-Regular",
    fontSize: 13,
    fontWeight: "700",
  },
});
