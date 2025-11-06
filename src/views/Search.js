import { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  Image,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Button,
} from "react-native";
import { SearchBar } from "@rneui/themed";
import { useFonts } from "expo-font";
import Loading from "../components/Loading";

const CONTAINER_HEIGHT = 60;

export default function Search({ navigation }) {
  const [pokemonList, setPokemonList] = useState([]);
  const [filteredPokemonList, setFilteredPokemonList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [shiny, setShiny] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const offsetAnim = useRef(new Animated.Value(0)).current;
  const [loaded] = useFonts({
    "Noto Sans Symbols 2": require("../../assets/fonts/NotoSansSymbols2-Regular.ttf"),
  });
  const flatListRef = useRef()

  const POKE_API_BASE_URL = "https://pokeapi.co/api/v2";
  const POKE_SPRITE_BASE_URL = shiny
    ? "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/"
    : "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

  var _clampedScrollValue = 0;
  var _offsetValue = 0;
  var _scrollValue = 0;

  useEffect(() => {
    fetch(`${POKE_API_BASE_URL}/pokemon?limit=1000`)
      .then((response) => response.json())
      .then((data) => {
        setPokemonList(data.results);
        setFilteredPokemonList(data.results);
        setIsLoading(false);
      })
      .catch((error) => console.log(error));

    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={() => {
            setShiny((prev) => {
              {
                alert(`Set to ${prev ? "normal" : "shiny"}`);
                return !prev;
              }
            });
          }}
          title="Shiny"
        />
      ),
      headerLeft: () => (
        <Button 
        onPress={() => toTop()}
        title="Top"
        />
      )
    });

    scrollY.addListener(({ value }) => {
      const diff = value - _scrollValue;
      _scrollValue = value;
      _clampedScrollValue = Math.min(
        Math.max(_clampedScrollValue * diff, 0),
        CONTAINER_HEIGHT
      );
    });
    offsetAnim.addListener(({ value }) => {
      _offsetValue = value;
    });
  }, [navigation, setShiny]);

  const toTop = () => {
    flatListRef.current.scrollToOffset({ animated: true, offset: 0 })
}

  const clampedScroll = Animated.diffClamp(
    Animated.add(
      scrollY.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolateLeft: "clamp",
      }),
      offsetAnim
    ),
    0,
    CONTAINER_HEIGHT
  );

  const headerTranslate = clampedScroll.interpolate({
    inputRange: [0, CONTAINER_HEIGHT],
    outputRange: [0, -CONTAINER_HEIGHT],
    extrapolate: "clamp",
  });

  const handleSearch = (text) => {
    setSearchText(text);
    const filteredList = pokemonList.filter((pokemon) =>
      pokemon.name.includes(text.toLowerCase())
    );
    setFilteredPokemonList(filteredList);
  };

  const renderItem = ({ item }) => {
    const pokemonId = item.url.split("/")[6];
    const pokemonImageUri = `${POKE_SPRITE_BASE_URL}${pokemonId}.png`;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => navigation.navigate("Details", { pokemon: item })}
      >
        <Image
          source={{ uri: pokemonImageUri }}
          style={Platform.isPad ? styles.itemImagePad : styles.itemImageIos}
        />
        <Text style={styles.itemText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  let scrollEndTimer = null;
  const onMomentumScrollBegin = () => {
    clearTimeout(scrollEndTimer);
  };
  const onMomentumScrollEnd = () => {
    const toValue =
      _scrollValue > CONTAINER_HEIGHT &&
      _clampedScrollValue > CONTAINER_HEIGHT / 2
        ? _offsetValue + CONTAINER_HEIGHT
        : _offsetValue - CONTAINER_HEIGHT;

    Animated.timing(offsetAnim, {
      toValue,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };
  const onScrollEndDrag = () => {
    scrollEndTimer = setTimeout(onMomentumScrollEnd, 250);
  };

  if (isLoading || !loaded) {
    return (
      <Loading />
    );
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
      ref={flatListRef}
        data={filteredPokemonList}
        renderItem={renderItem}
        keyExtractor={(item) => item.url}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        numColumns={Platform.isPad ? 4 : 3}
        columnWrapperStyle={{
          justifyContent: "space-evenly",
        }}
        contentContainerStyle={styles.listContainer}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={1}
      />
      <Animated.View
        style={[
          styles.searchInputContainer,
          { transform: [{ translateY: headerTranslate }] },
        ]}
      >
        <SearchBar
          placeholder="Pesquise pelo nome"
          onChangeText={handleSearch}
          value={searchText}
          platform="ios"
          containerStyle={styles.searchInputContainer}
          inputContainerStyle={styles.searchInput}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "column",
    alignItems: "center",
    borderRadius: 17,
    borderBottomWidth: 0.9,
    borderBottomColor: "#E2E2E2",
  },
  itemImageIos: {
    width: 90,
    height: 90,
    shadowColor: "#171717",
    shadowOffset: { width: 3.5, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  itemImagePad: {
    width: 110,
    height: 110,
    shadowColor: "#171717",
    shadowOffset: { width: 3.5, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  itemText: {
    fontSize: 17,
    fontWeight: "300",
    textTransform: "capitalize",
    color: "black",
    marginBottom: 1,
    fontFamily: "Noto Sans Symbols 2",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f3f2f9",
  },
  searchInputContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    height: CONTAINER_HEIGHT,
    backgroundColor: "rgba(243, 242, 249, 0.7)",
  },

  searchInput: {
    height: 15,
    backgroundColor: "#e3e3e8",
  },
  listContainer: {
    width: "100%",
    marginTop: CONTAINER_HEIGHT,
  },
});
