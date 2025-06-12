import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const nodeCount = 8;

export default function HealthReportScreen() {
  const [nodePositions, setNodePositions] = useState([]);
  const nodeAnimations = useRef(Array(nodeCount).fill().map(() => ({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5),
    position: new Animated.ValueXY()
  }))).current;

  useEffect(() => {
    const initialNodePositions = Array(nodeCount).fill().map(() => {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.25;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;

      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        size: Math.random() * 70 + 40,
        delay: Math.random() * 2000,
        duration: Math.random() * 3000 + 3000,
        color: `rgba(79, 195, 247, ${Math.random() * 0.3 + 0.2})`
      };
    });
    setNodePositions(initialNodePositions);

    nodeAnimations.forEach((anim, index) => {
      const { x, y, delay, duration } = initialNodePositions[index];
      const destX = x + (Math.random() - 0.5) * width * 0.15;
      const destY = y + (Math.random() - 0.5) * height * 0.15;

      anim.position.setValue({ x, y });

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 0.5,
            duration: duration * 0.3,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: 1,
            duration: duration * 0.4,
            easing: Easing.out(Easing.elastic(1)),
            useNativeDriver: true,
          })
        ]),
        Animated.loop(Animated.sequence([
          Animated.timing(anim.position, {
            toValue: { x: destX, y: destY },
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.position, {
            toValue: { x, y },
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          })
        ]))
      ]).start();
    });

    return () => nodeAnimations.forEach(anim => {
      anim.opacity.stopAnimation();
      anim.scale.stopAnimation();
      anim.position.stopAnimation();
    });
  }, []);

  const healthMetrics = [
    {
      id: 1,
      title: 'Heart Rate',
      value: '72 BPM',
      icon: 'heart-pulse',
      color: '#FF6B6B',
      status: 'Normal',
      trend: 'up'
    },
    {
      id: 2,
      title: 'Blood Pressure',
      value: '120/80',
      icon: 'water-outline',
      color: '#4FC3F7',
      status: 'Optimal',
      trend: 'stable'
    },
    {
      id: 3,
      title: 'BMI',
      value: '22.5',
      icon: 'scale-bathroom',
      color: '#00E676',
      status: 'Healthy',
      trend: 'down'
    },
    {
      id: 4,
      title: 'Sleep Quality',
      value: '7.5h',
      icon: 'sleep',
      color: '#BA68C8',
      status: 'Good',
      trend: 'up'
    }
  ];

  const weeklyData = [
    { day: 'Mon', steps: 8500, calories: 1650 },
    { day: 'Tue', steps: 9200, calories: 1720 },
    { day: 'Wed', steps: 7800, calories: 1580 },
    { day: 'Thu', steps: 10500, calories: 1890 },
    { day: 'Fri', steps: 9800, calories: 1750 },
    { day: 'Sat', steps: 12000, calories: 2100 },
    { day: 'Sun', steps: 6500, calories: 1450 }
  ];

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'trending-neutral';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return '#00E676';
      case 'down': return '#FF6B6B';
      default: return '#FFB74D';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#0D1421', '#062350', '#0C3B69']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {nodePositions.map((node, index) => (
          <Animated.View
            key={`node-${index}`}
            style={{
              position: 'absolute',
              width: node.size,
              height: node.size,
              borderRadius: node.size / 2,
              backgroundColor: node.color,
              transform: [
                { translateX: Animated.subtract(nodeAnimations[index].position.x, node.size / 2) },
                { translateY: Animated.subtract(nodeAnimations[index].position.y, node.size / 2) },
                { scale: nodeAnimations[index].scale }
              ],
              opacity: nodeAnimations[index].opacity,
            }}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#4FC3F7" />
          </Pressable>
          <Text style={styles.title}>Health Report</Text>
          <Text style={styles.subtitle}>Track your wellness journey</Text>
        </View>

        <View style={styles.metricsGrid}>
          {healthMetrics.map((metric) => (
            <View key={metric.id} style={styles.metricCard}>
              <LinearGradient
                colors={['#1E1E1E', '#2A2A2A', '#1A1A1A']}
                style={styles.gradientCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.metricHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${metric.color}20` }]}>
                    <MaterialCommunityIcons name={metric.icon} size={28} color={metric.color} />
                  </View>
                  <MaterialCommunityIcons 
                    name={getTrendIcon(metric.trend)} 
                    size={20} 
                    color={getTrendColor(metric.trend)} 
                  />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricTitle}>{metric.title}</Text>
                <Text style={[styles.metricStatus, { color: metric.color }]}>{metric.status}</Text>
              </LinearGradient>
            </View>
          ))}
        </View>

        <View style={styles.chartContainer}>
          <LinearGradient
            colors={['#1A237E', '#0D1421']}
            style={styles.chartCard}
          >
            <Text style={styles.chartTitle}>Weekly Activity</Text>
            <View style={styles.chartWrapper}>
              {weeklyData.map((data, index) => (
                <View key={data.day} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View 
                      style={[
                        styles.stepsBar, 
                        { 
                          height: (data.steps / 12000) * 100,
                          backgroundColor: '#4FC3F7'
                        }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.caloriesBar, 
                        { 
                          height: (data.calories / 2100) * 100,
                          backgroundColor: '#FFB74D'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.dayLabel}>{data.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4FC3F7' }]} />
                <Text style={styles.legendText}>Steps</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FFB74D' }]} />
                <Text style={styles.legendText}>Calories</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.insightsContainer}>
          <LinearGradient
            colors={['#0D2F10', '#173E19']}
            style={styles.insightsCard}
          >
            <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#00E676" />
            <Text style={styles.insightsTitle}>Health Insights</Text>
            <Text style={styles.insightsText}>
              Your heart rate has been consistently in the healthy range. Consider increasing your daily steps to 10,000 for optimal cardiovascular health.
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0D1421' 
  },
  backgroundContainer: { 
    position: 'absolute', 
    width: 400, 
    height :785,
  },
  backgroundGradient: { 
    flex: 1 
  },
  scrollViewContent: { 
    padding: 20,
    paddingBottom: 40
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 195, 247, 0.1)'
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#4FC3F7',
    marginBottom: 5,
    textAlign: 'center',
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 14,
    color: '#B0BEC5',
    fontStyle: 'italic'
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 30
  },
  metricCard: {
    width: (width - 55) / 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientCard: {
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 140
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  iconContainer: {
    borderRadius: 8,
    padding: 8
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5
  },
  metricTitle: {
    fontSize: 14,
    color: '#B0BEC5',
    marginBottom: 5
  },
  metricStatus: {
    fontSize: 12,
    fontWeight: '600'
  },
  chartContainer: {
    marginBottom: 30
  },
  chartCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center'
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 15
  },
  barContainer: {
    alignItems: 'center',
    flex: 1
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 8
  },
  stepsBar: {
    width: 8,
    borderRadius: 4,
    minHeight: 10
  },
  caloriesBar: {
    width: 8,
    borderRadius: 4,
    minHeight: 10
  },
  dayLabel: {
    fontSize: 10,
    color: '#B0BEC5',
    fontWeight: '500'
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  legendText: {
    fontSize: 12,
    color: '#B0BEC5'
  },
  insightsContainer: {
    marginBottom: 20
  },
  insightsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center'
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00E676',
    marginTop: 10,
    marginBottom: 10
  },
  insightsText: {
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 20
  }
});