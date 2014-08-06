
SVG.extend(SVG.Element, {
  // alias clone method
  deepClone: function() {
    return this.clone();
  }
});

SVG.extend(SVG.G, {
  // clone object with its children
  deepClone: function() {
    // Create a new group one step up and remove the clone from the old group
    var clone = this.parent.group();
    clone.remove();

    this.each(function() {
      clone.add(this.deepClone());
    });

    return clone;
  }
});